import express from 'express';
import {
    register,
    login,
    getCurrentUser,
    updateProfile,
    updateProfilePicture,
    changePassword,
    getApplicationHistory,
    verifyEmail
} from '../controllers/auth.controller.js';
import auth from '../middleware/auth.middleware.js';
import upload from '../config/upload.js';
import processImage from '../middleware/imageProcessor.js';
import { registerValidation, loginValidation, changePasswordValidation } from '../middleware/validators.js';

const router = express.Router();

// @route   POST /api/auth/register
// @access  Public
router.post('/register', registerValidation, register);

// @route   POST /api/auth/login
// @access  Public
router.post('/login', loginValidation, login);

// @route   GET /api/auth/me
// @access  Private
router.get('/me', auth, getCurrentUser);

// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', auth, updateProfile);

// @route   PUT /api/auth/profile-picture
// @access  Private
router.put('/profile-picture', auth, upload.single('profilePicture'), processImage, updateProfilePicture);

// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', auth, changePasswordValidation, changePassword);

// @route   GET /api/auth/verify-email/:token
// @access  Public
router.get('/verify-email/:token', verifyEmail);

// @route   GET /api/auth/applications
// @access  Private (Students only)
router.get('/applications', auth, getApplicationHistory);

export default router;