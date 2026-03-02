import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';

const ConversationList = ({ conversations, selectedConversation, onSelectConversation }) => {
  const { user } = useContext(AuthContext);
  const { onlineUsers } = useContext(SocketContext);

  const userId = user._id || user.id;

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find(p => p._id !== userId);
  };

  const formatTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return messageDate.toLocaleDateString();
  };

  const getUnreadCount = (conversation) => {
    return conversation.unreadCount?.[userId] || 0;
  };

  return (
    <div className="divide-y">
      {conversations.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No conversations yet</p>
          <p className="text-sm mt-1">Start a new conversation</p>
        </div>
      ) : (
        conversations.map((conversation) => {
          const otherUser = getOtherParticipant(conversation);
          const isOnline = onlineUsers.has(otherUser._id);
          const unreadCount = getUnreadCount(conversation);

          return (
            <button
              key={conversation._id}
              onClick={() => onSelectConversation(conversation)}
              className={`w-full p-4 hover:bg-gray-50 transition text-left ${selectedConversation?._id === conversation._id ? 'bg-blue-50' : ''
                }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {otherUser.name.charAt(0).toUpperCase()}
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">{otherUser.name}</h4>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.updatedAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {conversation.lastMessage ? (
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage.sender === userId ? 'You: ' : ''}
                        {conversation.lastMessage.content || '📎 File'}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">No messages yet</p>
                    )}
                    {unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {otherUser.department} • {otherUser.role}
                  </p>
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
};

export default ConversationList;