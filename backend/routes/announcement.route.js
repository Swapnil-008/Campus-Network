import express from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  markAsRead,
  updateAnnouncement,
  deleteAnnouncement
} from '../controllers/announcement.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   POST /api/announcements
// @access  Private (Teachers, TnP Admin, College Admin)
router.post('/', auth, createAnnouncement);

// @route   GET /api/announcements
// @access  Private
router.get('/', auth, getAnnouncements);

// @route   GET /api/announcements/:id
// @access  Private
router.get('/:id', auth, getAnnouncementById);

// @route   PUT /api/announcements/:id/read
// @access  Private
router.put('/:id/read', auth, markAsRead);

// @route   PUT /api/announcements/:id
// @access  Private (Creator or Admin)
router.put('/:id', auth, updateAnnouncement);

// @route   DELETE /api/announcements/:id
// @access  Private (Creator or Admin)
router.delete('/:id', auth, deleteAnnouncement);

export default router;