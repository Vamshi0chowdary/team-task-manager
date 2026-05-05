const express = require('express');
const { getDashboard, getDashboardActivity } = require('../controllers/dashboard.controller');

const router = express.Router();

router.get('/', getDashboard);
router.get('/activity', getDashboardActivity);

module.exports = router;
