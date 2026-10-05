const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const { getReminders } = require('../controllers/reminderController');

router.get('/', requireAuth, getReminders);

module.exports = router;
