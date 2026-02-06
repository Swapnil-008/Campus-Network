import express from 'express';
import {
  createGroup,
  getUserGroups,
  getGroupById,
  searchGroups,
  joinGroup,
  leaveGroup,
  approveJoinRequest,
  removeMember,
  makeAdmin,
  removeAdmin,
  updateGroupSettings,
  deleteGroup
} from '../controllers/group.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', auth, createGroup);
router.get('/my-groups', auth, getUserGroups);
router.get('/search', auth, searchGroups);
router.get('/:id', auth, getGroupById);
router.post('/:id/join', auth, joinGroup);
router.post('/:id/leave', auth, leaveGroup);
router.post('/:id/approve', auth, approveJoinRequest);
router.post('/:id/remove-member', auth, removeMember);
router.post('/:id/make-admin', auth, makeAdmin);
router.post('/:id/remove-admin', auth, removeAdmin);
router.put('/:id/settings', auth, updateGroupSettings);
router.delete('/:id', auth, deleteGroup);

export default router;