const express = require('express');
const router = express.Router();
const { login, getMe, logout, forgotPassword, checkResetToken, resetPassword } = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.post('/logout', logout);

// Forgot password (public)
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', checkResetToken);
router.post('/reset-password', resetPassword);

module.exports = router;
