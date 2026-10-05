const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const { getExecutiveKpis } = require('../controllers/statsController');
const { getDashboardAnalytics } = require('../controllers/dashboardController');

router.get('/kpis', requireAuth, requirePermission('dashboard.view'), getExecutiveKpis);
router.get('/dashboard', requireAuth, requirePermission('dashboard.view'), getDashboardAnalytics);

module.exports = router;
