const GroupList = ({ groups, selectedGroup, onSelectGroup }) => {
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

  return (
    <div className="divide-y">
      {groups.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No groups yet</p>
          <p className="text-sm mt-1">Create or join a group to get started</p>
        </div>
      ) : (
        groups.map((group) => (
          <button
            key={group._id}
            onClick={() => onSelectGroup(group)}
            className={`w-full p-4 hover:bg-gray-50 transition text-left ${
              selectedGroup?._id === group._id ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">{getGroupIcon(group.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900 truncate">{group.name}</h4>
                  <span className="text-xs text-gray-500">
                    {formatTime(group.updatedAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">{group.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {group.members?.length || 0} members
                  </span>
                  {group.settings?.onlyAdminsCanPost && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      Admin only
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
};

export default GroupList;