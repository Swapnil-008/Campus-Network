import Message from '../models/message.model.js';
import Group from '../models/group.model.js';
import Conversation from '../models/conversation.model.js';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const userSockets = new Map(); // userId -> Set<socketId>
const typingUsers = new Map(); // room -> Set of userIds

export const setupSocket = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.user.id;

      // Attach user data
      const user = await User.findById(socket.userId).select('name email department role');
      socket.userData = user;

      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);

    // Store socket ID for this user (supports multiple tabs)
    if (!userSockets.has(socket.userId)) {
      userSockets.set(socket.userId, new Set());
    }
    userSockets.get(socket.userId).add(socket.id);

    // Emit online status to all other users
    socket.broadcast.emit('user:online', { userId: socket.userId });

    // Send the list of currently online users to the newly connected user
    const onlineUserIds = Array.from(userSockets.keys());
    socket.emit('users:online-list', onlineUserIds);

    // Join user's personal room (for receiving DMs and notifications)
    socket.join(`user:${socket.userId}`);

    // Auto-join all groups the user is a member of
    Group.find({ members: socket.userId, isActive: true }).select('_id').then(groups => {
      groups.forEach(g => {
        socket.join(`group:${g._id}`);
      });
    });

    // ==================== GROUP EVENTS ====================

    // Join group room
    socket.on('group:join', async (groupId) => {
      try {
        const group = await Group.findById(groupId);
        if (group && group.members.some(m => m.toString() === socket.userId)) {
          socket.join(`group:${groupId}`);
        }
      } catch (err) {
        console.error('Error joining group:', err);
      }
    });

    // Leave group room
    socket.on('group:leave', (groupId) => {
      socket.leave(`group:${groupId}`);
    });

    // Send group message
    socket.on('group:message', async (data) => {
      try {
        const { groupId, content, messageType, file } = data;

        const group = await Group.findById(groupId);
        if (!group || !group.members.some(m => m.toString() === socket.userId)) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        if (group.settings.onlyAdminsCanPost && !group.admins.some(a => a.toString() === socket.userId)) {
          return socket.emit('error', { message: 'Only admins can send messages in this group' });
        }

        const message = new Message({
          conversationType: 'group',
          group: groupId,
          sender: socket.userId,
          messageType: messageType || 'text',
          content: messageType === 'text' ? content : null,
          file: file || null
        });

        await message.save();
        await message.populate('sender', 'name email department');

        // Update group's updatedAt
        group.updatedAt = new Date();
        await group.save();

        // Emit to all group members (including sender, so they see the message)
        io.to(`group:${groupId}`).emit('group:message', message);

        // Stop typing indicator for sender
        handleStopTyping(socket, `group:${groupId}`, io);

      } catch (err) {
        console.error('Error sending group message:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Group typing indicator
    socket.on('group:typing', (groupId) => {
      handleTyping(socket, `group:${groupId}`, io);
    });

    socket.on('group:stop-typing', (groupId) => {
      handleStopTyping(socket, `group:${groupId}`, io);
    });

    // ==================== DIRECT MESSAGE EVENTS ====================

    // Join direct conversation room
    socket.on('direct:join', (otherUserId) => {
      const conversationId = getConversationId(socket.userId, otherUserId);
      socket.join(`conversation:${conversationId}`);
    });

    // Leave direct conversation room
    socket.on('direct:leave', (otherUserId) => {
      const conversationId = getConversationId(socket.userId, otherUserId);
      socket.leave(`conversation:${conversationId}`);
    });

    // Send direct message
    socket.on('direct:message', async (data) => {
      try {
        const { recipientId, content, messageType, file } = data;

        const message = new Message({
          conversationType: 'direct',
          sender: socket.userId,
          recipient: recipientId,
          messageType: messageType || 'text',
          content: messageType === 'text' ? content : null,
          file: file || null
        });

        await message.save();
        await message.populate('sender recipient', 'name email department');

        // Update or create conversation
        const conversationId = getConversationId(socket.userId, recipientId);
        let conversation = await Conversation.findOne({
          participants: { $all: [socket.userId, recipientId] }
        });

        if (!conversation) {
          conversation = new Conversation({
            participants: [socket.userId, recipientId],
            lastMessage: message._id,
            unreadCount: { [recipientId]: 1 }
          });
        } else {
          conversation.lastMessage = message._id;
          conversation.updatedAt = new Date();
          const currentUnread = conversation.unreadCount.get(recipientId) || 0;
          conversation.unreadCount.set(recipientId, currentUnread + 1);
        }

        await conversation.save();

        // Emit to the conversation room (both users if they have it open)
        io.to(`conversation:${conversationId}`).emit('direct:message', message);

        // ALSO emit to the recipient's personal room so they get the message
        // even if they don't have this conversation open
        io.to(`user:${recipientId}`).emit('direct:new-conversation', {
          message,
          conversationId
        });

        // Notify recipient with notification event
        const recipientSockets = userSockets.get(recipientId);
        if (recipientSockets && recipientSockets.size > 0) {
          for (const socketId of recipientSockets) {
            io.to(socketId).emit('notification:new-message', {
              from: socket.userData,
              message: message,
              conversationId
            });
          }

          // Mark as delivered
          message.deliveredTo.push({
            user: recipientId,
            deliveredAt: new Date()
          });
          await message.save();

          socket.emit('message:delivered', { messageId: message._id });
        }

        // Stop typing indicator
        handleStopTyping(socket, `conversation:${conversationId}`, io);

      } catch (err) {
        console.error('Error sending direct message:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Direct message typing indicator
    socket.on('direct:typing', (otherUserId) => {
      const conversationId = getConversationId(socket.userId, otherUserId);
      handleTyping(socket, `conversation:${conversationId}`, io);
    });

    socket.on('direct:stop-typing', (otherUserId) => {
      const conversationId = getConversationId(socket.userId, otherUserId);
      handleStopTyping(socket, `conversation:${conversationId}`, io);
    });

    // ==================== MESSAGE STATUS EVENTS ====================

    // Mark messages as read
    socket.on('messages:read', async (data) => {
      try {
        const { messageIds, conversationType, conversationId } = data;

        await Message.updateMany(
          {
            _id: { $in: messageIds },
            'readBy.user': { $ne: socket.userId }
          },
          {
            $push: {
              readBy: {
                user: socket.userId,
                readAt: new Date()
              }
            }
          }
        );

        // Notify senders about read status
        const messages = await Message.find({ _id: { $in: messageIds } });
        messages.forEach(msg => {
          const senderSockets = userSockets.get(msg.sender.toString());
          if (senderSockets) {
            for (const socketId of senderSockets) {
              io.to(socketId).emit('message:read', {
                messageId: msg._id,
                readBy: socket.userId,
                readAt: new Date()
              });
            }
          }
        });

        // Update conversation unread count
        if (conversationType === 'direct') {
          await Conversation.findOneAndUpdate(
            { participants: { $all: [socket.userId, conversationId] } },
            { [`unreadCount.${socket.userId}`]: 0 }
          );
        }

        // Notify the sender so they can refresh their conversation list
        socket.emit('messages:read-confirmed', { messageIds });

      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    });

    // ==================== DISCONNECT ====================

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);

      const sockets = userSockets.get(socket.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(socket.userId);
          socket.broadcast.emit('user:offline', { userId: socket.userId });
        }
      }

      // Clean up typing indicators
      for (const [room, users] of typingUsers.entries()) {
        users.delete(socket.userId);
        if (users.size === 0) {
          typingUsers.delete(room);
        }
      }
    });
  });
};

// Helper: Get consistent conversation ID for two users
const getConversationId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('-');
};

// Helper: Handle typing indicator
const handleTyping = (socket, room, io) => {
  if (!typingUsers.has(room)) {
    typingUsers.set(room, new Set());
  }

  const users = typingUsers.get(room);
  users.add(socket.userId);

  socket.to(room).emit('user:typing', {
    userId: socket.userId,
    userName: socket.userData.name
  });

  setTimeout(() => {
    if (users.has(socket.userId)) {
      handleStopTyping(socket, room, io);
    }
  }, 3000);
};

// Helper: Handle stop typing
const handleStopTyping = (socket, room, io) => {
  const users = typingUsers.get(room);
  if (users) {
    users.delete(socket.userId);

    socket.to(room).emit('user:stop-typing', {
      userId: socket.userId
    });
  }
};