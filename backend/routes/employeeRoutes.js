const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const {
  listEmployees,
  listPendingHires,
  prefillEmployee,
  registerEmployee,
  updateEmployee,
  announceEmployee,
  withdrawAnnouncement,
  releaseHires,
  restoreHire,
  exportEmployees
} = require('../controllers/employeeController');

router.use(requireAuth);

router.get('/', requirePermission('employee.view'), listEmployees);
router.get('/pending', requirePermission('employee.view'), listPendingHires);
router.get('/export.xlsx', requirePermission('employee.view'), exportEmployees);
router.get('/prefill/:applicationId', requirePermission('employee.manage'), prefillEmployee);
router.post('/', requirePermission('employee.manage'), registerEmployee);
router.post('/release', requirePermission('employee.manage'), releaseHires);
router.post('/restore', requirePermission('employee.manage'), restoreHire);
router.patch('/:id', requirePermission('employee.manage'), updateEmployee);
router.post('/:id/announce', requirePermission('employee.manage'), announceEmployee);
router.delete('/:id/announce', requirePermission('employee.manage'), withdrawAnnouncement);

module.exports = router;
