import { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import { getGroupMessages, getDirectMessages } from '../../services/api';
import { uploadFile } from '../../services/api';
import MessageBubble from './MessageBubble';
import toast from 'react-hot-toast';

const ChatWindow = ({ chatType, chatData, conversationData }) => {
  const { user } = useContext(AuthContext);
  const { socket, onlineUsers } = useContext(SocketContext);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isGroup = chatType === 'group';
  const chatId = isGroup ? chatData._id : chatData._id;

  useEffect(() => {
    fetchMessages();
    
    if (socket) {
      if (isGroup) {
        socket.emit('group:join', chatData._id);
      } else {
        socket.emit('direct:join', chatData._id);
      }
    }

    return () => {
      if (socket) {
        if (isGroup) {
          socket.emit('group:leave', chatData._id);
        } else {
          socket.emit('direct:leave', chatData._id);
        }
      }
    };
  }, [chatId, chatType]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    };

    const handleTyping = ({ userId, userName }) => {
      if (userId !== user.id) {
        setTypingUsers(prev => {
          if (!prev.find(u => u.userId === userId)) {
            return [...prev, { userId, userName }];
          }
          return prev;
        });
      }
    };

    const handleStopTyping = ({ userId }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    };

    if (isGroup) {
      socket.on('group:message', handleNewMessage);
      socket.on('user:typing', handleTyping);
      socket.on('user:stop-typing', handleStopTyping);
    } else {
      socket.on('direct:message', handleNewMessage);
      socket.on('user:typing', handleTyping);
      socket.on('user:stop-typing', handleStopTyping);
    }

    return () => {
      if (isGroup) {
        socket.off('group:message', handleNewMessage);
        socket.off('user:typing', handleTyping);
        socket.off('user:stop-typing', handleStopTyping);
      } else {
        socket.off('direct:message', handleNewMessage);
        socket.off('user:typing', handleTyping);
        socket.off('user:stop-typing', handleStopTyping);
      }
    };
  }, [socket, isGroup, user.id]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = isGroup
        ? await getGroupMessages(chatData._id)
        : await getDirectMessages(chatData._id);
      setMessages(res.data);
      scrollToBottom();
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleTyping = () => {
    if (!socket) return;

    if (isGroup) {
      socket.emit('group:typing', chatData._id);
    } else {
      socket.emit('direct:typing', chatData._id);
    }

    // Auto stop typing after 3 seconds
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 3000);
  };

  const handleStopTyping = () => {
    if (!socket) return;

    if (isGroup) {
      socket.emit('group:stop-typing', chatData._id);
    } else {
      socket.emit('direct:stop-typing', chatData._id);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket) return;

    setSending(true);
    handleStopTyping();

    try {
      if (isGroup) {
        socket.emit('group:message', {
          groupId: chatData._id,
          content: newMessage,
          messageType: 'text'
        });
      } else {
        socket.emit('direct:message', {
          recipientId: chatData._id,
          content: newMessage,
          messageType: 'text'
        });
      }

      setNewMessage('');
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !socket) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await uploadFile(formData);
      const fileData = {
        name: res.data.originalname,
        url: `http://localhost:5000${res.data.url}`,
        type: res.data.mimetype,
        size: res.data.size
      };

      if (isGroup) {
        socket.emit('group:message', {
          groupId: chatData._id,
          messageType: 'file',
          file: fileData
        });
      } else {
        socket.emit('direct:message', {
          recipientId: chatData._id,
          messageType: 'file',
          file: fileData
        });
      }

      toast.success('File sent');
    } catch (err) {
      toast.error('Failed to upload file');
    }

    e.target.value = '';
  };

  const isOnline = !isGroup && onlineUsers.has(chatData._id);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isGroup ? (
            <>
              <div className="text-3xl">👥</div>
              <div>
                <h3 className="font-bold text-lg">{chatData.name}</h3>
                <p className="text-sm text-gray-500">
                  {chatData.members?.length || 0} members
                  {chatData.settings?.onlyAdminsCanPost && ' • Admin only'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {chatData.name.charAt(0).toUpperCase()}
                </div>
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">{chatData.name}</h3>
                <p className="text-sm text-gray-500">
                  {isOnline ? 'Online' : 'Offline'} • {chatData.department}
                </p>
              </div>
            </>
          )}
        </div>

        <button className="text-gray-600 hover:text-gray-900">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-gray-500">
            <div className="text-6xl mb-4">💬</div>
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isOwn={message.sender._id === user.id}
            />
          ))
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
            <span>
              {typingUsers[0].userName} {typingUsers.length > 1 && `and ${typingUsers.length - 1} other${typingUsers.length > 2 ? 's' : ''}`} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <label className="cursor-pointer text-gray-600 hover:text-gray-900">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
            />
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </label>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onBlur={handleStopTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;