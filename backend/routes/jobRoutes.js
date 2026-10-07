const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const {
  listJobs,
  getJobById,
  getJobForManagement,
  listHiringManagers,
  createJob,
  updateJob,
  deleteJob
} = require('../controllers/jobController');

router.get('/', listJobs);
router.get('/manage', requireAuth, requirePermission('jobs.manage'), (req, res) => {
  req.jobsManagement = true;
  return listJobs(req, res);
});
router.get('/hiring-managers', requireAuth, requirePermission('jobs.manage'), listHiringManagers);
router.get('/:id/manage', requireAuth, requirePermission('jobs.manage'), getJobForManagement);
router.get('/:id', getJobById);
// Writes are CMS-only; listing stays public for the career portal
const canManage = [requireAuth, requirePermission('jobs.manage')];
router.post('/', ...canManage, createJob);
router.put('/:id', ...canManage, updateJob);
router.delete('/:id', ...canManage, deleteJob);

module.exports = router;
