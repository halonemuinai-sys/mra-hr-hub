const express = require('express');
const router = express.Router();
const { getExecutiveKpis } = require('../controllers/statsController');

router.get('/kpis', getExecutiveKpis);

module.exports = router;
