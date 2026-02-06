import { useState, useEffect } from 'react';
import { searchGroups, joinGroup } from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

const BrowseGroupsModal = ({ onClose, onGroupJoined }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, [searchTerm, typeFilter]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (typeFilter !== 'all') params.type = typeFilter;

      const res = await searchGroups(params);
      setGroups(res.data);
    } catch (err) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (groupId) => {
    setJoiningId(groupId);
    try {
      const res = await joinGroup(groupId);
      toast.success(res.data.message);
      onGroupJoined();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join group');
    } finally {
      setJoiningId(null);
    }
  };

  const getGroupIcon = (type) => {
    const icons = {
      project: '🚀',
      class: '📚',
      club: '🎯',
      event: '📅',
      study: '✏️',
      general: '💬'
    };
    return icons[type] || '👥';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Browse Groups</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search groups..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          />

          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'general', 'project', 'class', 'club', 'event', 'study'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  typeFilter === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <LoadingSpinner />
          ) : groups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No groups found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group._id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-3xl">{getGroupIcon(group.type)}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>{group.members?.length || 0} members</span>
                          <span>•</span>
                          <span>{group.type}</span>
                          {group.settings?.onlyAdminsCanPost && (
                            <>
                              <span>•</span>
                              <span className="text-yellow-600">Admin only</span>
                            </>
                          )}
                          {group.settings?.requireApproval && (
                            <>
                              <span>•</span>
                              <span className="text-orange-600">Approval required</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoin(group._id)}
                      disabled={joiningId === group._id}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300 text-sm font-medium whitespace-nowrap"
                    >
                      {joiningId === group._id ? 'Joining...' : 'Join'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseGroupsModal;