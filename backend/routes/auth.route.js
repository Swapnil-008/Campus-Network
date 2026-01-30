import express from 'express';
import { 
    register, 
    login, 
    getCurrentUser,
    updateProfile,
    changePassword,
    getApplicationHistory    
} from '../controllers/auth.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   POST /api/auth/register
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/me
// @access  Private
router.get('/me', auth, getCurrentUser);

// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', auth, updateProfile);

// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', auth, changePassword);

// @route   GET /api/auth/applications
// @access  Private (Students only)
router.get('/applications', auth, getApplicationHistory);

export default router;