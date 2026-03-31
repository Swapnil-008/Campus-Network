import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/user.model.js';
import Company from '../models/company.model.js';

// @desc    Register a new user
export const register = async (req, res) => {
  try {
    const { name, email, password, role, department, year, cgpa } = req.body;

    // Restrict self-registration to student and teacher roles only
    const allowedSelfRegisterRoles = ['student', 'teacher'];
    if (!allowedSelfRegisterRoles.includes(role)) {
      return res.status(400).json({
        message: 'Only student and teacher roles can self-register. Contact admin for other roles.'
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate college email (customize this for your college)
    // if (!email.endsWith('@yourcollege.edu')) {
    //   return res.status(400).json({ message: 'Please use your college email' });
    // }

    // Create user object
    user = new User(
    {
      name,
      email,
      password,
      role,
      department: (role === 'student' || role === 'teacher') ? department : undefined,
      year: role === 'student' ? year : undefined,
      cgpa: role === 'student' ? cgpa : undefined,
      isApproved: role === 'student' ? true : false,
      emailVerificationToken: crypto.randomBytes(32).toString('hex')
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user
    await user.save();

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    // Sign token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        cgpa: user.cgpa,
        isApproved: user.isApproved,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified
      },
      emailVerificationToken: user.emailVerificationToken
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user)
    {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    // Check approval status
    if (!user.isApproved)
    {
      return res.status(403).json({
        message: 'Your account is pending approval. Please contact the administrator.'
      });
    }
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
    {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    // Sign token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        cgpa: user.cgpa,
        isApproved: user.isApproved,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, department, year, cgpa } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    user.name = name || user.name;

    // Only students can update these fields
    if (user.role === 'student') {
      user.department = department || user.department;
      user.year = year || user.year;
      user.cgpa = cgpa !== undefined ? cgpa : user.cgpa;
    }

    await user.save();

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        cgpa: user.cgpa,
        isApproved: user.isApproved,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update profile picture
export const updateProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    user.profilePicture = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({
      profilePicture: user.profilePicture,
      message: 'Profile picture updated'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide both current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's application history
export const getApplicationHistory = async (req, res) => {
  try {
    // Only students can view their application history
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can view application history' });
    }

    const companies = await Company.find({
      'applications.student': req.user.id
    })
      .populate('createdBy', 'name email role')
      .sort({ 'applications.appliedAt': -1 });

    // Extract application details
    const applications = companies.map(company => {
      const application = company.applications.find(
        app => app.student.toString() === req.user.id
      );

      return {
        _id: company._id,
        companyName: company.companyName,
        role: company.role,
        packageOffered: company.packageOffered,
        deadline: company.deadline,
        isActive: company.isActive,
        appliedAt: application?.appliedAt,
        status: new Date(company.deadline) < new Date() ? 'closed' : 'open'
      };
    });

    res.json(applications);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};