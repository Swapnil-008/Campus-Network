import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'tnp_admin', 'college_admin'],
    required: true
  },
  department: {
    type: String,
    enum: ['CS', 'IT', 'ENTC'],  // MAKE SURE EnTC IS HERE
    required: function() {
      return this.role === 'student' || this.role === 'teacher';
    }
  },
  year: {
    type: Number,
    min: 1,
    max: 4,
    required: function() {
      return this.role === 'student';
    }
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 10,
    required: function() {
      return this.role === 'student';
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);