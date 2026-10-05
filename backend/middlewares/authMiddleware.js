const jwt = require('jsonwebtoken');
const prisma = require('../api/db');
const { hasPermission } = require('../config/permissions');

const { JWT_SECRET } = require('../config/jwt');

/**
 * Middleware untuk memverifikasi JWT Bearer Token pada endpoint CMS
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token otentikasi tidak ditemukan.'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Format token otentikasi tidak valid. Gunakan format "Bearer <token>".'
    });
  }

  const token = parts[1];

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Sesi login Anda telah berakhir atau token tidak valid. Silakan login kembali.'
    });
  }

  // Always use the current role / active flag from DB (role changes & deactivation apply immediately)
  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Akun Anda tidak aktif atau telah dihapus. Hubungi Super Admin.'
      });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware opsional untuk memeriksa role user
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Silakan login terlebih dahulu.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Hak akses tidak memadai. Posisi Anda (${req.user.role}) tidak diizinkan mengakses fitur ini.`
      });
    }

    next();
  };
}

/**
 * Middleware: user must hold at least one of the given permissions (see config/permissions.js)
 */
function requirePermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Akses ditolak. Silakan login terlebih dahulu.' });
    }
    if (!permissions.some((p) => hasPermission(req.user, p))) {
      return res.status(403).json({
        success: false,
        message: `Hak akses tidak memadai untuk fitur ini (${req.user.role}).`
      });
    }
    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
  requirePermission
};
