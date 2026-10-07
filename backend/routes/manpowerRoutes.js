const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const { listRequests, getRequest, createRequest, updateRequest, decideRequest, cancelRequest } = require('../controllers/manpowerController');

router.use(requireAuth, requirePermission('manpower.view'));

router.get('/', listRequests);
router.get('/:id', getRequest);
router.post('/', requirePermission('manpower.request'), createRequest);
// Requester or approver while pending — checked per request in the controller
router.patch('/:id', updateRequest);
router.post('/:id/decide', requirePermission('manpower.approve'), decideRequest);
router.post('/:id/cancel', cancelRequest);

module.exports = router;
