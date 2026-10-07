const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const { listAnnouncements } = require('../controllers/employeeController');

// Internal "Selamat Bergabung" board — every CMS user
router.get('/', requireAuth, requirePermission('dashboard.view'), listAnnouncements);

module.exports = router;
