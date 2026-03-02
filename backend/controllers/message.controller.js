import Message from '../models/message.model.js';
import Group from '../models/group.model.js';
import Conversation from '../models/conversation.model.js';
import User from '../models/user.model.js';

// Helper to escape regex
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get group messages (with cursor pagination)
export const getGroupMessages = async (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    const groupId = req.params.groupId;
    const parsedLimit = Math.min(parseInt(limit) || 50, 100);

    // Verify user is member
    const group = await Group.findById(groupId);
    if (!group || !group.members.some(m => m.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let query = {
      group: groupId,
      conversationType: 'group',
      isDeleted: false
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email department profilePicture')
      .populate('replyTo', 'content sender messageType')
      .sort({ createdAt: -1 })
      .limit(parsedLimit + 1); // Fetch one extra to check if there are more

    const hasMore = messages.length > parsedLimit;
    const result = hasMore ? messages.slice(0, parsedLimit) : messages;

    res.json({
      messages: result.reverse(),
      hasMore
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get direct messages (with cursor pagination)
export const getDirectMessages = async (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    const otherUserId = req.params.userId;
    const parsedLimit = Math.min(parseInt(limit) || 50, 100);

    let query = {
      conversationType: 'direct',
      isDeleted: false,
      $or: [
        { sender: req.user.id, recipient: otherUserId },
        { sender: otherUserId, recipient: req.user.id }
      ]
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender recipient', 'name email department profilePicture')
      .populate('replyTo', 'content sender messageType')
      .sort({ createdAt: -1 })
      .limit(parsedLimit + 1);

    const hasMore = messages.length > parsedLimit;
    const result = hasMore ? messages.slice(0, parsedLimit) : messages;

    res.json({
      messages: result.reverse(),
      hasMore
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all conversations (direct message list)
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'name email department profilePicture')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name email' }
      })
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search messages within a chat
export const searchMessages = async (req, res) => {
  try {
    const { q, chatType, chatId, limit = 20 } = req.query;
    if (!q || !chatType || !chatId) {
      return res.status(400).json({ message: 'Query, chatType and chatId are required' });
    }

    const escaped = escapeRegex(q);
    let query = {
      isDeleted: false,
      content: { $regex: escaped, $options: 'i' }
    };

    if (chatType === 'group') {
      query.conversationType = 'group';
      query.group = chatId;
    } else {
      query.conversationType = 'direct';
      query.$or = [
        { sender: req.user.id, recipient: chatId },
        { sender: chatId, recipient: req.user.id }
      ];
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email department profilePicture')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(messages.reverse());
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        'readBy.user': { $ne: req.user.id }
      },
      {
        $push: {
          readBy: {
            user: req.user.id,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete message
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can delete
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted';
    await message.save();

    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search users for starting new conversations
export const searchUsersForChat = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {
      _id: { $ne: req.user.id },
      isApproved: true
    };

    if (search) {
      const escaped = escapeRegex(search);
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { department: { $regex: escaped, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('name email department role profilePicture')
      .sort({ name: 1 })
      .limit(30);

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};