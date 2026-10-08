const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const { listOnboarding, getChecklist, startChecklist, addTask, updateTask, deleteTask, setProbationEnd } = require('../controllers/onboardingController');

router.use(requireAuth, requirePermission('employee.view'));

router.get('/', listOnboarding);
// Task updates: HR & TA any task, Hiring Managers their line-manager tasks (checked in the controller)
router.patch('/tasks/:taskId', updateTask);
router.delete('/tasks/:taskId', requirePermission('employee.manage'), deleteTask);
router.get('/:employeeId', getChecklist);
router.post('/:employeeId/start', requirePermission('employee.manage'), startChecklist);
router.post('/:employeeId/tasks', requirePermission('employee.manage'), addTask);
router.patch('/:employeeId/probation', requirePermission('employee.manage'), setProbationEnd);

module.exports = router;
