const express = require('express');
const router = express.Router();
const {
  listCandidates,
  getCandidateById,
  createCandidateWithApplication,
  updateApplicationStatus,
  deleteCandidate
} = require('../controllers/candidateController');

router.get('/', listCandidates);
router.get('/:id', getCandidateById);
router.post('/apply', createCandidateWithApplication);
router.patch('/applications/:applicationId/status', updateApplicationStatus);
router.delete('/:id', deleteCandidate);

module.exports = router;
