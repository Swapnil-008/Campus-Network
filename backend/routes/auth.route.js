import express from 'express';
import { register, login, getCurrentUser } from '../controllers/auth.controller.js';
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

export default router;