const { parseResume } = require('../services/atsParserService');
const { calculateAtsMatchScore } = require('../services/profilingService');
const prisma = require('../api/db');

async function parseResumeUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File CV (PDF/DOCX) wajib diunggah.' });
    }

    const { buffer, mimetype, originalname } = req.file;
    const parsedData = await parseResume(buffer, mimetype, originalname);

    return res.json({
      success: true,
      message: 'CV berhasil diekstraksi oleh ATS Parser.',
      data: parsedData
    });
  } catch (error) {
    console.error('Error parsing resume:', error);
    return res.status(500).json({ success: false, message: error.message || 'Gagal mengekstrak CV.' });
  }
}

async function simulateAtsScore(req, res) {
  try {
    const { candidate, jobId } = req.body;
    if (!candidate) {
      return res.status(400).json({ success: false, message: 'Data kandidat wajib disediakan.' });
    }

    let jobPosting = null;
    if (jobId) {
      jobPosting = await prisma.jobPosting.findUnique({ where: { id: jobId } });
    }

    const evaluation = calculateAtsMatchScore(candidate, jobPosting);

    return res.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('Error simulating ATS score:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  parseResumeUpload,
  simulateAtsScore
};
