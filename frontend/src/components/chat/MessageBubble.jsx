const MessageBubble = ({ message, isOwn }) => {
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (type) => {
    if (type?.includes('image')) return '🖼️';
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('word')) return '📝';
    if (type?.includes('excel') || type?.includes('sheet')) return '📊';
    if (type?.includes('powerpoint') || type?.includes('presentation')) return '📽️';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwn && (
          <span className="text-xs text-gray-500 mb-1 px-2">
            {message.sender?.name}
          </span>
        )}
        
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
          }`}
        >
          {message.messageType === 'text' ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : message.messageType === 'file' && message.file ? (
            <a
              href={message.file.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 ${
                isOwn ? 'hover:opacity-80' : 'hover:bg-gray-50'
              } p-2 rounded transition`}
            >
              <span className="text-3xl">{getFileIcon(message.file.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message.file.name}</p>
                {message.file.size && (
                  <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatFileSize(message.file.size)}
                  </p>
                )}
              </div>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </a>
          ) : null}
          
          <div className="flex items-center justify-end gap-1 mt-1">
            <span
              className={`text-xs ${
                isOwn ? 'text-blue-100' : 'text-gray-500'
              }`}
            >
              {formatTime(message.createdAt)}
            </span>
            {isOwn && (
              <span className="text-blue-100">
                {message.readBy?.length > 1 ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;