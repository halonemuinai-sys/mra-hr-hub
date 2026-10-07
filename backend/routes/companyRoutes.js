const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const { listCompanies, createCompany, updateCompany } = require('../controllers/companyController');

router.use(requireAuth);

// Options for job / employee forms and PT filters
router.get('/', listCompanies);
router.post('/', requirePermission('company.manage'), createCompany);
router.patch('/:id', requirePermission('company.manage'), updateCompany);

module.exports = router;
