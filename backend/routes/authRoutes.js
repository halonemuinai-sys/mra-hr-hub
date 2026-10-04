const express = require('express');
const router = express.Router();
const { login, getMe, logout } = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.post('/logout', logout);

module.exports = router;
