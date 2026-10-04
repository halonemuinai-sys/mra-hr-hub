const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parseResumeUpload, simulateAtsScore } = require('../controllers/atsController');

// Multer in-memory storage for rapid ATS parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

router.post('/parse-cv', upload.single('resume'), parseResumeUpload);
router.post('/simulate-score', simulateAtsScore);

module.exports = router;
