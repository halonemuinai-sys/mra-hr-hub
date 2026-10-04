const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const { getAccessMatrix, listUsers, createUser, updateUser } = require('../controllers/userController');

router.use(requireAuth);

// Any CMS user may see what each role can do
router.get('/access-matrix', getAccessMatrix);

router.get('/', requirePermission('users.manage'), listUsers);
router.post('/', requirePermission('users.manage'), createUser);
router.patch('/:id', requirePermission('users.manage'), updateUser);

module.exports = router;
