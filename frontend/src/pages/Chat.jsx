import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { getUserGroups, getConversations } from '../services/api';
import GroupList from '../components/chat/GroupList';
import ConversationList from '../components/chat/ConversationList';
import ChatWindow from '../components/chat/ChatWindow';
import CreateGroupModal from '../components/chat/CreateGroupModal';
import BrowseGroupsModal from '../components/chat/BrowseGroupsModal';
import NewMessageModal from '../components/chat/NewMessageModal';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Chat = () => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [activeTab, setActiveTab] = useState('groups');
  const [groups, setGroups] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showBrowseGroups, setShowBrowseGroups] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchConversations();
  }, []);

  // Listen for sidebar-level events
  useEffect(() => {
    if (!socket) return;

    // When recipient gets a new DM (even if they haven't opened the conversation)
    const handleNewConversation = () => {
      fetchConversations();
    };

    // When a notification of a new message comes in
    const handleNewNotification = () => {
      fetchConversations();
    };

    // When messages are marked as read, refresh to clear badges
    const handleReadConfirmed = () => {
      fetchConversations();
    };

    socket.on('direct:new-conversation', handleNewConversation);
    socket.on('notification:new-message', handleNewNotification);
    socket.on('messages:read-confirmed', handleReadConfirmed);

    return () => {
      socket.off('direct:new-conversation', handleNewConversation);
      socket.off('notification:new-message', handleNewNotification);
      socket.off('messages:read-confirmed', handleReadConfirmed);
    };
  }, [socket]);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await getUserGroups();
      setGroups(res.data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await getConversations();
      setConversations(res.data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, []);

  const handleSelectGroup = (group) => {
    setSelectedChat({
      type: 'group',
      data: group
    });
  };

  const handleSelectConversation = (conversation) => {
    const userId = user._id || user.id;
    const otherUser = conversation.participants.find(p => p._id !== userId);
    if (!otherUser) return;
    setSelectedChat({
      type: 'direct',
      data: otherUser,
      conversationData: conversation
    });
  };

  const handleSelectNewUser = (selectedUser) => {
    setShowNewMessage(false);
    setActiveTab('direct');
    setSelectedChat({
      type: 'direct',
      data: selectedUser,
      conversationData: null
    });
  };

  const handleGroupCreated = () => {
    setShowCreateGroup(false);
    fetchGroups();
  };

  const handleGroupJoined = () => {
    setShowBrowseGroups(false);
    fetchGroups();
  };

  const handleGroupUpdated = () => {
    fetchGroups();
  };

  const handleConversationRead = () => {
    fetchConversations();
  };

  return (
    <div className="flex h-[calc(100vh-140px)]">
      {/* Sidebar */}
      <div className="w-80 border-r bg-white flex flex-col shrink-0">
        {/* Tabs */}
        <div className="flex border-b shrink-0">
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 py-3 font-medium transition ${activeTab === 'groups'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            👥 Groups
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-3 font-medium transition ${activeTab === 'direct'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            💬 Messages
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-3 border-b space-y-2 shrink-0">
          {activeTab === 'groups' ? (
            <>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
              >
                + Create Group
              </button>
              <button
                onClick={() => setShowBrowseGroups(true)}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition text-sm font-medium"
              >
                🔍 Browse Groups
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowNewMessage(true)}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
            >
              + New Message
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <LoadingSpinner />
          ) : activeTab === 'groups' ? (
            <GroupList
              groups={groups}
              selectedGroup={selectedChat?.type === 'group' ? selectedChat.data : null}
              onSelectGroup={handleSelectGroup}
            />
          ) : (
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedChat?.type === 'direct' ? selectedChat.conversationData : null}
              onSelectConversation={handleSelectConversation}
            />
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-gray-50 min-w-0">
        {selectedChat ? (
          <ChatWindow
            key={`${selectedChat.type}-${selectedChat.data._id || selectedChat.data.id}`}
            chatType={selectedChat.type}
            chatData={selectedChat.data}
            conversationData={selectedChat.conversationData}
            onGroupUpdated={handleGroupUpdated}
            onConversationRead={handleConversationRead}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg font-medium">Select a chat</p>
              <p className="text-sm mt-1">Choose a group or conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}

      {showBrowseGroups && (
        <BrowseGroupsModal
          onClose={() => setShowBrowseGroups(false)}
          onGroupJoined={handleGroupJoined}
        />
      )}

      {showNewMessage && (
        <NewMessageModal
          onClose={() => setShowNewMessage(false)}
          onSelectUser={handleSelectNewUser}
        />
      )}
    </div>
  );
};

export default Chat;