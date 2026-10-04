const express = require('express');
const router = express.Router();
const multer = require('multer');
const { downloadTemplate, uploadTemplate } = require('../controllers/templateController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB for bulk Excel files
});

router.get('/download', downloadTemplate);
router.post('/upload', upload.single('template'), uploadTemplate);

module.exports = router;
