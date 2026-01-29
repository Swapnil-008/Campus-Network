import express from 'express';
import {
  getAllUsers,
  approveUser,
  deleteUser,
  updateUserRole,
  getStatistics
} from '../controllers/admin.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/admin/users
// @access  Private (College Admin only)
router.get('/users', auth, getAllUsers);

// @route   PUT /api/admin/users/:id/approve
// @access  Private (College Admin only)
router.put('/users/:id/approve', auth, approveUser);

// @route   DELETE /api/admin/users/:id
// @access  Private (College Admin only)
router.delete('/users/:id', auth, deleteUser);

// @route   PUT /api/admin/users/:id/role
// @access  Private (College Admin only)
router.put('/users/:id/role', auth, updateUserRole);

// @route   GET /api/admin/statistics
// @access  Private (Admin only)
router.get('/statistics', auth, getStatistics);

export default router;