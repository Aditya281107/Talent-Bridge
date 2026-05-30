const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      content: {
        type: String,
        default: '',
      },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      createdAt: {
        type: Date,
      },
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding conversations by participant
conversationSchema.index({ participants: 1 });
// Index for sorting by latest activity
conversationSchema.index({ 'lastMessage.createdAt': -1 });

// Static method to find or create a conversation between two users
conversationSchema.statics.findOrCreate = async function (user1Id, user2Id, applicationId) {
  // Sort participant IDs to ensure consistent lookup
  const participants = [user1Id, user2Id].sort((a, b) => a.toString().localeCompare(b.toString()));

  let conversation = await this.findOne({
    participants: { $all: participants, $size: 2 },
  });

  if (!conversation) {
    conversation = await this.create({
      participants,
      application: applicationId || undefined,
      unreadCount: new Map([
        [user1Id.toString(), 0],
        [user2Id.toString(), 0],
      ]),
    });
  }

  return conversation;
};

module.exports = mongoose.model('Conversation', conversationSchema);
