const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../api/db');
const { permissionsFor } = require('../config/permissions');

const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');
const mailCfg = require('../config/mail');
const { sendMail } = require('../services/mail/mailer');
const T = require('../services/mail/templates');
const { later } = require('../services/mail/applicantMail');
const { TTL_MINUTES, createResetToken, readResetToken, matchesUser, validateNewPassword, createLimiter, maskEmail } = require('../services/passwordReset');

// Forgot password: max 3 requests per e-mail and 10 per IP address per 15 minutes
const perEmail = createLimiter(3, 15 * 60000);
const perIp = createLimiter(10, 15 * 60000);
const FORGOT_REPLY = 'If the e-mail is registered, a reset link has been sent. Check your inbox (and spam folder).';

/**
 * POST /api/auth/login
 * Validasi email & password user
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Cari user di database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Kredensial tidak valid. Email tidak terdaftar dalam sistem CMS MRA HR HUB.'
      });
    }

    // Bandingkan password hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password salah. Silakan periksa kembali kata sandi Anda.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda dinonaktifkan. Hubungi Super Admin MRA HR HUB.'
      });
    }

    // Generate JWT Token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    return res.json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: permissionsFor(user.role)
      }
    });
  } catch (error) {
    console.error('Error saat login:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat autentikasi: ' + error.message
    });
  }
}

/**
 * GET /api/auth/me
 * Mendapatkan profil user yang sedang login via Bearer Token
 */
async function getMe(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Tidak terautentikasi.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Akun tidak ditemukan atau dinonaktifkan.'
      });
    }

    return res.json({
      success: true,
      user: { ...user, permissions: permissionsFor(user.role) }
    });
  } catch (error) {
    console.error('Error saat mengambil profil user:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat profil pengguna.'
    });
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res) {
  return res.json({
    success: true,
    message: 'Berhasil keluar dari sistem CMS MRA HR HUB.'
  });
}

/**
 * POST /api/auth/forgot-password { email }
 * Always answers the same way (no hint whether the address exists); the e-mail is sent in the background.
 */
async function forgotPassword(req, res) {
  try {
    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: 'Enter a valid e-mail address.' });
    if (!perIp(req.ip || 'ip') || !perEmail(email)) {
      return res.status(429).json({ success: false, message: 'Too many reset requests. Please wait 15 minutes and try again.' });
    }
    if (mailCfg.mode === 'off') {
      return res.status(503).json({ success: false, message: 'Password reset by e-mail is not available. Contact your HR HUB administrator.' });
    }
    later(async () => {
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, password: true, isActive: true } });
      if (!user || !user.isActive) return;
      const url = `${mailCfg.portalUrl}/admin/reset-password?token=${encodeURIComponent(createResetToken(user, JWT_SECRET))}`;
      const msg = T.passwordReset({ name: user.name, url, minutes: TTL_MINUTES });
      const r = await sendMail({ to: user.email, ...msg });
      if (r.status === 'logged') console.log(`🔑 [password reset] ${user.email} → ${url}`);
      if (r.status === 'failed') console.error(`🔑 [password reset] e-mail to ${user.email} failed: ${r.reason}`);
    });
    return res.json({ success: true, message: FORGOT_REPLY });
  } catch (error) {
    console.error('Error in forgot password:', error);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
}

async function loadResetUser(token) {
  const read = readResetToken(token, JWT_SECRET);
  if (!read.ok) return { check: read };
  const user = await prisma.user.findUnique({ where: { id: read.userId }, select: { id: true, name: true, email: true, password: true, isActive: true } });
  return { check: matchesUser(read, user), user };
}

/** GET /api/auth/reset-password/:token — is the link still usable? */
async function checkResetToken(req, res) {
  try {
    const { check, user } = await loadResetUser(req.params.token);
    if (!check.ok) return res.status(400).json({ success: false, message: check.reason });
    return res.json({ success: true, data: { name: user.name, email: maskEmail(user.email) } });
  } catch (error) {
    console.error('Error checking reset token:', error);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
}

/** POST /api/auth/reset-password { token, password } */
async function resetPassword(req, res) {
  try {
    const { token, password } = req.body || {};
    const { check, user } = await loadResetUser(token);
    if (!check.ok) return res.status(400).json({ success: false, message: check.reason });
    const problem = validateNewPassword(password, user.email);
    if (problem) return res.status(400).json({ success: false, message: problem });
    if (await bcrypt.compare(String(password), user.password)) {
      return res.status(400).json({ success: false, message: 'Choose a password that is different from your current one.' });
    }
    // Guard on the old hash so the same link cannot be used twice in parallel
    const done = await prisma.user.updateMany({ where: { id: user.id, password: user.password }, data: { password: await bcrypt.hash(String(password), 10) } });
    if (!done.count) return res.status(400).json({ success: false, message: 'This reset link was already used. Request a new one if needed.' });

    later(async () => {
      const when = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
      await sendMail({ to: user.email, ...T.passwordChanged({ name: user.name, when, loginUrl: `${mailCfg.portalUrl}/admin/login` }) });
    });
    return res.json({ success: true, message: 'Your password has been changed. You can now sign in.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
}

module.exports = {
  login,
  getMe,
  logout,
  forgotPassword,
  checkResetToken,
  resetPassword
};
