const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { jobRules, validate } = require('../middleware/validateMiddleware');

// Must be before /:id to avoid catching 'mine' as an ID
router.get('/mine', protect, authorize('employer'), getMyJobs);

router.route('/')
  .get(getJobs)
  .post(protect, authorize('employer'), jobRules, validate, createJob);

router.route('/:id')
  .get(getJobById)
  .put(protect, authorize('employer'), updateJob)
  .delete(protect, authorize('employer'), deleteJob);

module.exports = router;
