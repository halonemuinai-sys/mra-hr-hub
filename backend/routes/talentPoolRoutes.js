const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const c = require('../controllers/talentPoolController');

// TA team only: matching works across all candidates (Hiring Managers are limited to their jobs elsewhere)
router.use(requireAuth, requirePermission('pipeline.claim'));

router.get('/jobs', c.listJobs);
router.get('/jobs/:jobId', c.matchJob);
router.post('/jobs/:jobId/add', c.addToJob);
router.get('/candidates', c.listPool);

module.exports = router;
