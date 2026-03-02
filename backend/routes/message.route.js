import express from 'express';
import {
  getGroupMessages,
  getDirectMessages,
  getConversations,
  searchMessages,
  markAsRead,
  deleteMessage,
  searchUsersForChat
} from '../controllers/message.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/users/search', auth, searchUsersForChat);
router.get('/search', auth, searchMessages);
router.get('/group/:groupId', auth, getGroupMessages);
router.get('/direct/:userId', auth, getDirectMessages);
router.get('/conversations', auth, getConversations);
router.post('/mark-read', auth, markAsRead);
router.delete('/:id', auth, deleteMessage);

export default router;