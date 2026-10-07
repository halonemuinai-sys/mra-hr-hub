const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const { downloadRecruitmentReport } = require('../controllers/reportController');

// Contains candidate names and contacts → Super Admin / TA Lead
router.get('/recruitment.xlsx', requireAuth, requirePermission('team.monitor'), downloadRecruitmentReport);

module.exports = router;
