import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import { getGroupMessages, getDirectMessages, uploadFile, getGroupById, searchMessages } from '../../services/api';
import MessageBubble from './MessageBubble';
import GroupInfoPanel from './GroupInfoPanel';
import toast from 'react-hot-toast';

// Robust ID comparison
const getId = (obj) => {
  if (!obj) return null;
  if (typeof obj === 'string') return obj;
  return obj._id || obj.id || String(obj);
};
const idsMatch = (a, b) => {
  const idA = getId(a);
  const idB = getId(b);
  return idA && idB && idA.toString() === idB.toString();
};

const ChatWindow = ({ chatType, chatData, conversationData, onGroupUpdated, onConversationRead }) => {
  const { user } = useContext(AuthContext);
  const { socket, onlineUsers } = useContext(SocketContext);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groupData, setGroupData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageIdsRef = useRef(new Set());

  const isGroup = chatType === 'group';
  const chatId = chatData._id || chatData.id;
  const userId = user._id || user.id;

  const fetchGroupData = useCallback(async () => {
    if (!isGroup) return;
    try {
      const res = await getGroupById(chatId);
      setGroupData(res.data);
    } catch (err) {
      console.error('Error fetching group data:', err);
    }
  }, [chatId, isGroup]);

  useEffect(() => {
    setMessages([]);
    messageIdsRef.current.clear();
    setTypingUsers([]);
    setShowGroupInfo(false);
    setGroupData(null);
    setReplyingTo(null);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    fetchMessages();

    if (isGroup) fetchGroupData();

    if (socket) {
      if (isGroup) {
        socket.emit('group:join', chatId);
      } else {
        socket.emit('direct:join', chatId);
      }
    }

    return () => {
      if (socket) {
        if (isGroup) {
          socket.emit('group:leave', chatId);
        } else {
          socket.emit('direct:leave', chatId);
        }
      }
      clearTimeout(typingTimeoutRef.current);
    };
  }, [chatId, chatType, socket]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (isGroup) {
        if (getId(message.group) !== chatId) return;
      } else {
        const senderId = getId(message.sender);
        const recipientId = getId(message.recipient);
        if (!((senderId === chatId && recipientId === userId) || (senderId === userId && recipientId === chatId))) return;
      }

      const msgId = getId(message);
      if (msgId && messageIdsRef.current.has(msgId)) return;
      if (msgId) messageIdsRef.current.add(msgId);

      setMessages(prev => [...prev, message]);
      scrollToBottom();

      if (!idsMatch(message.sender, userId)) {
        markMessageRead(message);
      }
    };

    const handleTyping = ({ userId: typingUserId, userName }) => {
      if (typingUserId !== userId) {
        setTypingUsers(prev => {
          if (!prev.find(u => u.userId === typingUserId)) {
            return [...prev, { userId: typingUserId, userName }];
          }
          return prev;
        });
      }
    };

    const handleStopTyping = ({ userId: typingUserId }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== typingUserId));
    };

    // Real-time reaction updates
    const handleReactionUpdated = ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m =>
        getId(m) === messageId ? { ...m, reactions } : m
      ));
    };

    // Real-time edit updates
    const handleMessageEdited = ({ messageId, content, editedAt }) => {
      setMessages(prev => prev.map(m =>
        getId(m) === messageId ? { ...m, content, editedAt } : m
      ));
    };

    const handleError = (err) => {
      toast.error(err.message || 'Chat error');
    };

    const messageEvent = isGroup ? 'group:message' : 'direct:message';
    socket.on(messageEvent, handleNewMessage);
    socket.on('user:typing', handleTyping);
    socket.on('user:stop-typing', handleStopTyping);
    socket.on('message:reaction-updated', handleReactionUpdated);
    socket.on('message:edited', handleMessageEdited);
    socket.on('error', handleError);

    return () => {
      socket.off(messageEvent, handleNewMessage);
      socket.off('user:typing', handleTyping);
      socket.off('user:stop-typing', handleStopTyping);
      socket.off('message:reaction-updated', handleReactionUpdated);
      socket.off('message:edited', handleMessageEdited);
      socket.off('error', handleError);
    };
  }, [socket, isGroup, chatId, userId]);

  const markMessageRead = (message) => {
    if (!socket || !message._id) return;
    socket.emit('messages:read', {
      messageIds: [message._id],
      conversationType: isGroup ? 'group' : 'direct',
      conversationId: chatId
    });
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = isGroup
        ? await getGroupMessages(chatId, { limit: 50 })
        : await getDirectMessages(chatId, { limit: 50 });

      // Handle both old format (array) and new format ({ messages, hasMore })
      const data = res.data;
      const msgs = Array.isArray(data) ? data : data.messages;
      setHasMore(data.hasMore || false);

      messageIdsRef.current = new Set(msgs.map(m => m._id));
      setMessages(msgs);
      scrollToBottom();

      // Mark all unread as read
      const unreadMsgIds = msgs
        .filter(m => !idsMatch(m.sender, userId) && !m.readBy?.some(r => idsMatch(r.user, userId)))
        .map(m => m._id)
        .filter(Boolean);

      if (unreadMsgIds.length > 0 && socket) {
        socket.emit('messages:read', {
          messageIds: unreadMsgIds,
          conversationType: isGroup ? 'group' : 'direct',
          conversationId: chatId
        });
        if (onConversationRead) onConversationRead();
      }
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);

    const container = messagesContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;

    try {
      const oldestMessage = messages[0];
      const before = oldestMessage.createdAt;

      const res = isGroup
        ? await getGroupMessages(chatId, { limit: 50, before })
        : await getDirectMessages(chatId, { limit: 50, before });

      const data = res.data;
      const olderMsgs = Array.isArray(data) ? data : data.messages;
      setHasMore(data.hasMore || false);

      olderMsgs.forEach(m => messageIdsRef.current.add(m._id));
      setMessages(prev => [...olderMsgs, ...prev]);

      // Preserve scroll position
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    } catch (err) {
      toast.error('Failed to load more messages');
    } finally {
      setLoadingMore(false);
    }
  };

  // Chat search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await searchMessages({
        q: searchQuery,
        chatType: isGroup ? 'group' : 'direct',
        chatId
      });
      setSearchResults(res.data);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(handleSearch, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleTypingEvent = () => {
    if (!socket) return;
    if (isGroup) {
      socket.emit('group:typing', chatId);
    } else {
      socket.emit('direct:typing', chatId);
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(handleStopTypingEvent, 3000);
  };

  const handleStopTypingEvent = () => {
    if (!socket) return;
    if (isGroup) {
      socket.emit('group:stop-typing', chatId);
    } else {
      socket.emit('direct:stop-typing', chatId);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    setSending(true);
    handleStopTypingEvent();

    try {
      const payload = {
        content: newMessage,
        messageType: 'text',
        replyTo: replyingTo?._id || null
      };

      if (isGroup) {
        socket.emit('group:message', { groupId: chatId, ...payload });
      } else {
        socket.emit('direct:message', { recipientId: chatId, ...payload });
      }

      setNewMessage('');
      setReplyingTo(null);
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !socket) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await uploadFile(formData);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const baseUrl = apiUrl.replace('/api', '');

      const fileData = {
        name: res.data.originalname,
        url: `${baseUrl}${res.data.url}`,
        type: res.data.mimetype,
        size: res.data.size
      };

      if (isGroup) {
        socket.emit('group:message', { groupId: chatId, messageType: 'file', file: fileData });
      } else {
        socket.emit('direct:message', { recipientId: chatId, messageType: 'file', file: fileData });
      }

      toast.success('File sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  const handleGroupUpdated = () => {
    fetchGroupData();
    if (onGroupUpdated) onGroupUpdated();
  };

  const isOnline = !isGroup && onlineUsers?.has(chatId);
  const profilePic = chatData.profilePicture;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.replace('/api', '');

  const canPost = isGroup
    ? !chatData.settings?.onlyAdminsCanPost || chatData.admins?.some(a => idsMatch(a, userId))
    : true;

  const displayMessages = showSearch && searchResults.length > 0 ? searchResults : messages;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {isGroup ? (
            <>
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xl">
                👥
              </div>
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
                {profilePic ? (
                  <img src={`${baseUrl}${profilePic}`} alt={chatData.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {chatData.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">{chatData.name}</h3>
                <p className="text-sm text-gray-500">
                  {isOnline ? '🟢 Online' : '⚫ Offline'}
                  {chatData.department && ` • ${chatData.department}`}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search toggle */}
          <button
            onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); setSearchResults([]); }}
            className={`p-2 rounded-full transition ${showSearch ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Search messages"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {isGroup && (
            <button
              onClick={() => setShowGroupInfo(!showGroupInfo)}
              className={`p-2 rounded-full transition ${showGroupInfo ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Group Info"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="bg-white border-b px-4 py-2 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full px-4 py-2 pl-10 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
              autoFocus
            />
            <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searching && (
              <div className="absolute right-3 top-2.5">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          {searchResults.length > 0 && (
            <p className="text-xs text-gray-500 mt-1 px-2">{searchResults.length} results found</p>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {/* Load more button */}
            {hasMore && !showSearch && (
              <div className="text-center">
                <button
                  onClick={loadMoreMessages}
                  disabled={loadingMore}
                  className="text-sm text-blue-600 hover:text-blue-700 bg-white px-4 py-2 rounded-full shadow-sm border hover:shadow transition disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : '⬆️ Load earlier messages'}
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-500 text-sm">Loading messages...</span>
                </div>
              </div>
            ) : displayMessages.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full text-gray-500">
                <div className="text-6xl mb-4">{showSearch ? '🔍' : '💬'}</div>
                <p className="font-medium">{showSearch ? 'No results found' : 'No messages yet'}</p>
                <p className="text-sm mt-1">{showSearch ? 'Try a different search term' : 'Start the conversation!'}</p>
              </div>
            ) : (
              displayMessages.map((message) => (
                <MessageBubble
                  key={message._id || Math.random()}
                  message={message}
                  isOwn={idsMatch(message.sender, userId)}
                  isGroup={isGroup}
                  onReply={(msg) => setReplyingTo(msg)}
                  onEdit={() => { }}
                />
              ))
            )}

            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-1">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                </div>
                <span>{typingUsers.map(u => u.userName).join(', ')} typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Reply preview */}
          {replyingTo && (
            <div className="bg-blue-50 border-t border-l-4 border-blue-500 px-4 py-2 flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <p className="text-xs font-medium text-blue-600">
                  Replying to {idsMatch(replyingTo.sender, userId) ? 'yourself' : replyingTo.sender?.name || 'User'}
                </p>
                <p className="text-sm text-gray-600 truncate">{replyingTo.content || '📎 File'}</p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-gray-400 hover:text-gray-600 ml-2 p-1"
              >✕</button>
            </div>
          )}

          {/* Input */}
          <div className="bg-white border-t p-3 shrink-0">
            {canPost ? (
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <label className={`cursor-pointer p-2 rounded-full transition ${uploading ? 'text-blue-500 animate-pulse' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  )}
                </label>

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTypingEvent();
                  }}
                  onBlur={handleStopTypingEvent}
                  placeholder={replyingTo ? 'Type a reply...' : 'Type a message...'}
                  className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  disabled={sending || uploading}
                />

                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending || uploading}
                  className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            ) : (
              <div className="text-center text-gray-500 py-2 text-sm bg-gray-50 rounded-lg">
                🔒 Only admins can send messages in this group
              </div>
            )}
          </div>
        </div>

        {/* Group Info Panel */}
        {isGroup && showGroupInfo && groupData && (
          <GroupInfoPanel
            group={groupData}
            currentUser={user}
            onClose={() => setShowGroupInfo(false)}
            onGroupUpdated={handleGroupUpdated}
          />
        )}
      </div>
    </div>
  );
};

export default ChatWindow;