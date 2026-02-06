import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { getUserGroups, getConversations } from '../services/api';
import GroupList from '../components/chat/GroupList';
import ConversationList from '../components/chat/ConversationList';
import ChatWindow from '../components/chat/ChatWindow';
import CreateGroupModal from '../components/chat/CreateGroupModal';
import BrowseGroupsModal from '../components/chat/BrowseGroupsModal';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Chat = () => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [activeTab, setActiveTab] = useState('groups'); // 'groups' or 'direct'
  const [groups, setGroups] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showBrowseGroups, setShowBrowseGroups] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for new messages to update conversation list
    socket.on('direct:message', handleNewDirectMessage);
    socket.on('group:message', handleNewGroupMessage);

    return () => {
      socket.off('direct:message', handleNewDirectMessage);
      socket.off('group:message', handleNewGroupMessage);
    };
  }, [socket]);

  const fetchGroups = async () => {
    try {
      const res = await getUserGroups();
      setGroups(res.data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await getConversations();
      setConversations(res.data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const handleNewDirectMessage = (message) => {
    // Update conversation list
    fetchConversations();
  };

  const handleNewGroupMessage = (message) => {
    // Update group list timestamp
    fetchGroups();
  };

  const handleSelectGroup = (group) => {
    setSelectedChat({
      type: 'group',
      data: group
    });
  };

  const handleSelectConversation = (conversation) => {
    // Find the other participant
    const otherUser = conversation.participants.find(p => p._id !== user.id);
    setSelectedChat({
      type: 'direct',
      data: otherUser,
      conversationData: conversation
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

  return (
    <div className="flex h-[calc(100vh-140px)]">
      {/* Sidebar - Group/Conversation List */}
      <div className="w-80 border-r bg-white flex flex-col">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 py-3 font-medium transition ${
              activeTab === 'groups'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            👥 Groups
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-3 font-medium transition ${
              activeTab === 'direct'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            💬 Messages
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-3 border-b space-y-2">
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
      <div className="flex-1 bg-gray-50">
        {selectedChat ? (
          <ChatWindow
            chatType={selectedChat.type}
            chatData={selectedChat.data}
            conversationData={selectedChat.conversationData}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg">Select a group or conversation to start chatting</p>
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
    </div>
  );
};

export default Chat;