import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationType: {
    type: String,
    enum: ['group', 'direct'],
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image'],
    default: 'text'
  },
  content: {
    type: String,
    required: function () {
      return this.messageType === 'text';
    }
  },
  file: {
    name: String,
    url: String,
    type: String,
    size: Number
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  editedAt: {
    type: Date,
    default: null
  },
  originalContent: {
    type: String,
    default: null
  },
  reactions: [{
    emoji: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Indexes for faster queries
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ conversationType: 1, createdAt: -1 });
messageSchema.index({ content: 'text' }); // text search index for chat search

export default mongoose.models.Message || mongoose.model('Message', messageSchema);
