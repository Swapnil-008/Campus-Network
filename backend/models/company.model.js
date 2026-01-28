import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  packageOffered: {
    min: Number,
    max: Number
  },
  eligibility: {
    branches: [{
      type: String,
      enum: ['CS', 'IT', 'ENTC'],
      required: true
    }],
    minCGPA: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    years: [{
      type: Number,
      enum: [1, 2, 3, 4],
      required: true
    }]
  },
  deadline: {
    type: Date,
    required: true
  },
  formLink: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applications: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Index for faster queries
companySchema.index({ isActive: 1, deadline: 1 });
companySchema.index({ 'eligibility.branches': 1, 'eligibility.minCGPA': 1 });

// Auto-deactivate after deadline (we'll handle this in controller)
export default mongoose.model('Company', companySchema);