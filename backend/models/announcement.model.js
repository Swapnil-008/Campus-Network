import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  visibility: {
    type: {
      type: String,
      enum: ['global', 'department'],
      default: 'department'
    },
    departments: [{
      type: String,
      enum: ['CS', 'IT', 'ENTC'] 
    }]
  },
  priority: {
    type: String,
    enum: ['normal', 'important', 'urgent'],
    default: 'normal'
  },
  attachments: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    }
  }],  
  deadline: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

// Index for faster queries
announcementSchema.index({ 'visibility.type': 1, 'visibility.departments': 1, createdAt: -1 });
announcementSchema.index({ priority: 1 });

export default mongoose.model('Announcement', announcementSchema);