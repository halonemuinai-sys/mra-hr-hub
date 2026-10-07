const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const { getTeamPerformance, getRebalanceSuggestions, getTeamActivity } = require('../controllers/teamController');

router.use(requireAuth, requirePermission('team.monitor'));

router.get('/performance', getTeamPerformance);
router.get('/activity', getTeamActivity);
router.get('/rebalance', getRebalanceSuggestions);

module.exports = router;
