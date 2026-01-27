const AnnouncementCard = ({ announcement, onMarkRead }) => {
  const priorityColors = {
    normal: 'bg-blue-100 text-blue-800 border-blue-200',
    important: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    urgent: 'bg-red-100 text-red-800 border-red-200'
  };

  const priorityIcons = {
    normal: '📢',
    important: '⚠️',
    urgent: '🚨'
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${priorityColors[announcement.priority]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{priorityIcons[announcement.priority]}</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{announcement.title}</h3>
            <p className="text-sm text-gray-500">
              by {announcement.createdBy?.name} ({announcement.createdBy?.role})
              {announcement.createdBy?.department && ` - ${announcement.createdBy.department}`}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[announcement.priority]}`}>
          {announcement.priority.toUpperCase()}
        </span>
      </div>

      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{announcement.description}</p>

      {announcement.attachments && announcement.attachments.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
          <div className="space-y-1">
            {announcement.attachments.map((file, index) => (
              <a 
                key={index}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
              >
                📎 {file.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {announcement.deadline && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded">
          <p className="text-sm text-orange-800">
            ⏰ <strong>Deadline:</strong> {new Date(announcement.deadline).toLocaleString()}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-xs text-gray-500">
          Posted: {new Date(announcement.createdAt).toLocaleString()}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {announcement.visibility.type === 'global' ? '🌍 Global' : `🏢 ${announcement.visibility.departments.join(', ')}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementCard;