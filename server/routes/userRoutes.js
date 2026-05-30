const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  getDashboardStats,
  searchCandidates,
  searchEmployers,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.post('/profile/parse-resume', protect, authorize('seeker'), upload.single('resume'), require('../controllers/userController').parseResume);

router.get('/dashboard', protect, getDashboardStats);
router.get('/candidates', protect, authorize('employer'), searchCandidates);
router.get('/employers', protect, searchEmployers);

module.exports = router;
