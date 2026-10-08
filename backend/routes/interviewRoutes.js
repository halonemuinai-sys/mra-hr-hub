const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const { listInterviews, scheduleInterview } = require('../controllers/interviewController');

router.use(requireAuth, requirePermission('pipeline.view'));

router.get('/', listInterviews);
// PIC or TA Lead — checked per application in the controller
router.post('/:applicationId/schedule', scheduleInterview);

module.exports = router;
