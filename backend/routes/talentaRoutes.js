const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const { getStatus, getMasters, getEmployeeTalenta, saveEmployeeTalenta, syncEmployee } = require('../controllers/talentaController');

router.use(requireAuth);

router.get('/status', requirePermission('employee.view'), getStatus);
// Personal, salary, tax and bank data → HR only
router.get('/master-data', requirePermission('employee.sync'), getMasters);
router.get('/employees/:id', requirePermission('employee.sync'), getEmployeeTalenta);
router.put('/employees/:id', requirePermission('employee.sync'), saveEmployeeTalenta);
router.post('/employees/:id/sync', requirePermission('employee.sync'), syncEmployee);

module.exports = router;
