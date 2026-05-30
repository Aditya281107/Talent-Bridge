const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  startConversation,
  sendMessage,
  markAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/conversations', protect, getConversations);
router.post('/conversations', protect, startConversation);
router.get('/conversations/:id', protect, getMessages);
router.post('/conversations/:id', protect, sendMessage);
router.put('/conversations/:id/read', protect, markAsRead);

module.exports = router;
