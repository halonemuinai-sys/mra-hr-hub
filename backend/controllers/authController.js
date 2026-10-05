const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../api/db');
const { permissionsFor } = require('../config/permissions');

const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');

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

module.exports = {
  login,
  getMe,
  logout
};
