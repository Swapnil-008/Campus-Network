import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notification.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/notifications
// @access  Private
router.get('/', auth, getNotifications);

// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', auth, markAsRead);

// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all/all', auth, markAllAsRead);

// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', auth, deleteNotification);

export default router;