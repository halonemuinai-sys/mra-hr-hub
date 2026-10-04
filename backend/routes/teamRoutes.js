const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const { getTeamPerformance, getTeamActivity } = require('../controllers/teamController');

router.use(requireAuth, requirePermission('team.monitor'));

router.get('/performance', getTeamPerformance);
router.get('/activity', getTeamActivity);

module.exports = router;
