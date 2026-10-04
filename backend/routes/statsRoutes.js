const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const { getExecutiveKpis } = require('../controllers/statsController');

router.get('/kpis', requireAuth, requirePermission('dashboard.view'), getExecutiveKpis);

module.exports = router;
