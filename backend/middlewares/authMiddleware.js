const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hr_hub_secure_jwt_secret_token_2026_mra_automation';

/**
 * Middleware untuk memverifikasi JWT Bearer Token pada endpoint CMS
 */
function requireAuth(req, res, next) {
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

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Sesi login Anda telah berakhir atau token tidak valid. Silakan login kembali.'
    });
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

module.exports = {
  requireAuth,
  requireRole
};
