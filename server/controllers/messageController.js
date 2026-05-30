const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get all conversations for the logged-in user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name email avatar role title company')
      .populate('application', 'status')
      .sort({ 'lastMessage.createdAt': -1, updatedAt: -1 });

    // Add the other participant info for easy frontend access
    const formatted = conversations.map((conv) => {
      const other = conv.participants.find(
        (p) => p._id.toString() !== req.user._id.toString()
      );
      return {
        _id: conv._id,
        otherParticipant: other,
        lastMessage: conv.lastMessage,
        application: conv.application,
        unreadCount: conv.unreadCount?.get(req.user._id.toString()) || 0,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt,
      };
    });

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/conversations/:id
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      res.status(404);
      throw new Error('Conversation not found');
    }

    // Verify the user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      res.status(403);
      throw new Error('Not authorized to view this conversation');
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      Message.find({ conversation: req.params.id })
        .populate('sender', 'name avatar role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Message.countDocuments({ conversation: req.params.id }),
    ]);

    res.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start or get existing conversation
// @route   POST /api/messages/conversations
// @access  Private
const startConversation = async (req, res, next) => {
  try {
    const { targetUserId, applicationId } = req.body;

    if (!targetUserId) {
      res.status(400);
      throw new Error('Target user ID is required');
    }

    if (targetUserId === req.user._id.toString()) {
      res.status(400);
      throw new Error('Cannot start a conversation with yourself');
    }

    // Verify target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      res.status(404);
      throw new Error('Target user not found');
    }

    // Validate: one must be employer and the other seeker
    const roles = [req.user.role, targetUser.role].sort();
    if (!(roles[0] === 'employer' && roles[1] === 'seeker')) {
      res.status(400);
      throw new Error('Conversations can only be between an employer and a seeker');
    }

    const conversation = await Conversation.findOrCreate(
      req.user._id,
      targetUserId,
      applicationId
    );

    const populated = await Conversation.findById(conversation._id).populate(
      'participants',
      'name email avatar role title company'
    );

    const other = populated.participants.find(
      (p) => p._id.toString() !== req.user._id.toString()
    );

    res.status(200).json({
      success: true,
      data: {
        _id: populated._id,
        otherParticipant: other,
        lastMessage: populated.lastMessage,
        unreadCount: populated.unreadCount?.get(req.user._id.toString()) || 0,
        updatedAt: populated.updatedAt,
        createdAt: populated.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message
// @route   POST /api/messages/conversations/:id
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { content, messageType = 'text', linkMetadata } = req.body;

    if (!content || !content.trim()) {
      res.status(400);
      throw new Error('Message content is required');
    }

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      res.status(404);
      throw new Error('Conversation not found');
    }

    // Verify the user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      res.status(403);
      throw new Error('Not authorized to send messages in this conversation');
    }

    // Create the message
    const messageData = {
      conversation: conversation._id,
      sender: req.user._id,
      content: content.trim(),
      messageType,
      readBy: [req.user._id], // Sender has read their own message
    };

    if (messageType === 'link' && linkMetadata) {
      messageData.linkMetadata = linkMetadata;
    }

    const message = await Message.create(messageData);

    // Update conversation's last message and unread counts
    const otherParticipant = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );

    const currentUnread =
      conversation.unreadCount?.get(otherParticipant.toString()) || 0;

    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: {
        content: content.trim(),
        sender: req.user._id,
        createdAt: message.createdAt,
      },
      [`unreadCount.${otherParticipant.toString()}`]: currentUnread + 1,
    });

    const populatedMessage = await Message.findById(message._id).populate(
      'sender',
      'name avatar role'
    );

    // Emit via Socket.io if available
    const io = req.app.get('io');
    if (io) {
      io.to(otherParticipant.toString()).emit('new_message', {
        message: populatedMessage,
        conversationId: conversation._id,
      });
    }

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/conversations/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      res.status(404);
      throw new Error('Conversation not found');
    }

    // Verify the user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      res.status(403);
      throw new Error('Not authorized');
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        conversation: req.params.id,
        readBy: { $ne: req.user._id },
      },
      {
        $addToSet: { readBy: req.user._id },
      }
    );

    // Reset unread count for this user
    await Conversation.findByIdAndUpdate(req.params.id, {
      [`unreadCount.${req.user._id.toString()}`]: 0,
    });

    // Notify the other participant about read receipts
    const io = req.app.get('io');
    if (io) {
      const otherParticipant = conversation.participants.find(
        (p) => p.toString() !== req.user._id.toString()
      );
      io.to(otherParticipant.toString()).emit('messages_read', {
        conversationId: conversation._id,
        readBy: req.user._id,
      });
    }

    res.json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getMessages,
  startConversation,
  sendMessage,
  markAsRead,
};
