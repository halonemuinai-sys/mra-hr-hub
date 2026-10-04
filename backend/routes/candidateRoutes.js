const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const {
  listCandidates,
  getCandidateById,
  createCandidateWithApplication,
  updateApplicationStatus,
  getPublicApplicationStatus,
  deleteCandidate
} = require('../controllers/candidateController');
const { listPipeline, bulkUpdateApplicationStatus } = require('../controllers/pipelineController');
const { previewTransition, executeTransition } = require('../controllers/transitionController');
const { listApprovals, decideApproval, cancelApproval } = require('../controllers/approvalController');
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

// Pipeline board & ownership
router.get('/pipeline', requirePermission('pipeline.view'), listPipeline);
router.get('/recruiters', requirePermission('pipeline.view'), listRecruiters);
router.post('/applications/claim', claimApplications);
router.post('/applications/release', releaseApplications);
router.post('/applications/assign', assignApplications);
router.patch('/applications/bulk-status', bulkUpdateApplicationStatus);

// Stage gate (single move with validation / approval)
router.get('/applications/:applicationId/transition', requirePermission('pipeline.view'), previewTransition);
router.post('/applications/:applicationId/transition', executeTransition);

// Approvals
router.get('/approvals', requirePermission('pipeline.view'), listApprovals);
router.post('/approvals/:requestId/decide', decideApproval);
router.post('/approvals/:requestId/cancel', cancelApproval);

router.patch('/applications/:applicationId/status', updateApplicationStatus);
router.get('/applications/:applicationId/activity', requirePermission('candidate.view'), listApplicationActivity);
router.get('/:id', requirePermission('candidate.view'), getCandidateById);
router.delete('/:id', requirePermission('candidate.delete'), deleteCandidate);

module.exports = router;
