const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      trim: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'link', 'system'],
      default: 'text',
    },
    linkMetadata: {
      url: {
        type: String,
        default: '',
      },
      label: {
        type: String,
        default: '',
      },
      type: {
        type: String,
        enum: ['oa_link', 'interview_link', 'other', ''],
        default: '',
      },
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for fetching messages in a conversation
messageSchema.index({ conversation: 1, createdAt: -1 });
// Index for unread message queries
messageSchema.index({ conversation: 1, readBy: 1 });

module.exports = mongoose.model('Message', messageSchema);
