const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const {
  listCandidates,
  listPipeline,
  getCandidateById,
  createCandidateWithApplication,
  updateApplicationStatus,
  bulkUpdateApplicationStatus,
  getPublicApplicationStatus,
  deleteCandidate
} = require('../controllers/candidateController');
const {
  listRecruiters,
  claimApplications,
  releaseApplications,
  assignApplications,
  listApplicationActivity
} = require('../controllers/assignmentController');

// Public (career portal)
router.post('/apply', createCandidateWithApplication);
router.get('/status', getPublicApplicationStatus);

// CMS (authenticated)
router.use(requireAuth);

router.get('/', requirePermission('candidate.view'), listCandidates);
router.get('/pipeline', requirePermission('pipeline.view'), listPipeline);
router.get('/recruiters', requirePermission('pipeline.view'), listRecruiters);
router.post('/applications/claim', claimApplications);
router.post('/applications/release', releaseApplications);
router.post('/applications/assign', assignApplications);
router.patch('/applications/bulk-status', bulkUpdateApplicationStatus);
router.patch('/applications/:applicationId/status', updateApplicationStatus);
router.get('/applications/:applicationId/activity', requirePermission('candidate.view'), listApplicationActivity);
router.get('/:id', requirePermission('candidate.view'), getCandidateById);
router.delete('/:id', requirePermission('candidate.delete'), deleteCandidate);

module.exports = router;
