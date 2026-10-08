const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const c = require('../controllers/offerController');

// Viewing: pipeline.view (Hiring Managers scoped); writing: the candidate's PIC or a TA Lead (checked in the controller)
router.use(requireAuth, requirePermission('pipeline.view'));

router.get('/', c.listOffers);
router.get('/prefill/:applicationId', c.getPrefill);
router.post('/preview', c.preview);
router.post('/', c.createOffer);
router.get('/:id', c.getOffer);
router.patch('/:id', c.updateOffer);
router.get('/:id/pdf', c.downloadPdf);
router.post('/:id/send', c.sendOffer);
router.post('/:id/respond', c.respondOffer);
router.post('/:id/cancel', c.cancelOffer);

module.exports = router;
