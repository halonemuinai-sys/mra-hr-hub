const express = require('express');
const router = express.Router();
const {
  listCandidates,
  listPipeline,
  getCandidateById,
  createCandidateWithApplication,
  updateApplicationStatus,
  bulkUpdateApplicationStatus,
  deleteCandidate
} = require('../controllers/candidateController');

router.get('/', listCandidates);
router.get('/pipeline', listPipeline);
router.get('/:id', getCandidateById);
router.post('/apply', createCandidateWithApplication);
router.patch('/applications/bulk-status', bulkUpdateApplicationStatus);
router.patch('/applications/:applicationId/status', updateApplicationStatus);
router.delete('/:id', deleteCandidate);

module.exports = router;
