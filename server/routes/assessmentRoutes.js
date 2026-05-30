const express = require('express');
const router = express.Router();
const { listAssessments, createAssessment } = require('../controllers/assessmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Assessment template management (Employer only)
router.get('/', protect, authorize('employer'), listAssessments);
router.post('/', protect, authorize('employer'), createAssessment);

module.exports = router;
