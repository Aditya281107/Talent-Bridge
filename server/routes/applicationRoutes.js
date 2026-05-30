const express = require('express');
const router = express.Router();
const {
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getApplicationHistory,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { applicationRules, validate } = require('../middleware/validateMiddleware');

const { getAssessment, submitAssessment } = require('../controllers/assessmentController');

router.post('/', protect, authorize('seeker'), applicationRules, validate, applyToJob);
router.get('/mine', protect, authorize('seeker'), getMyApplications);
router.get('/job/:jobId', protect, authorize('employer'), getJobApplications);
router.get('/job/:jobId/scoreboard', protect, authorize('employer'), require('../controllers/assessmentController').getScoreboard);
router.put('/:id/status', protect, authorize('employer'), updateApplicationStatus);
router.get('/:id/history', protect, getApplicationHistory);
router.get('/:id/offer-letter', protect, authorize('employer'), require('../controllers/applicationController').generateOfferLetterPDF);

// --- Bonus Stage: OA Routes ---
router.get('/:id/assessment', protect, authorize('seeker'), getAssessment);
router.post('/:id/assessment', protect, authorize('seeker'), submitAssessment);
router.post('/:id/run-code', protect, authorize('seeker'), require('../controllers/assessmentController').runCodeDemo);
router.put('/:id/assign-oa', protect, authorize('employer'), require('../controllers/assessmentController').assignAssessment);

module.exports = router;
