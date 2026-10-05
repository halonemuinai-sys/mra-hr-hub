const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');
const { downloadTemplate, uploadTemplate, applyWithTemplate } = require('../controllers/templateController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB for bulk Excel files
});
// A single-applicant template is tiny; keep the public limit small
const publicUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
});

router.get('/download', downloadTemplate);

// Public career portal: one applicant per file, never overwrites existing profiles
router.post('/apply', publicUpload.single('template'), applyWithTemplate);

// CMS bulk import
router.post('/upload', requireAuth, requirePermission('candidate.import'), upload.single('template'), uploadTemplate);

module.exports = router;
