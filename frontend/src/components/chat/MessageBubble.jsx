const MessageBubble = ({ message, isOwn, isGroup }) => {
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (type) => {
    if (type?.includes('image')) return '🖼️';
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    if (type?.includes('excel') || type?.includes('sheet') || type?.includes('csv')) return '📊';
    if (type?.includes('powerpoint') || type?.includes('presentation')) return '📽️';
    if (type?.includes('video')) return '🎬';
    if (type?.includes('audio')) return '🎵';
    if (type?.includes('text')) return '📃';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isImage = message.file?.type?.includes('image');
  const isDeleted = message.isDeleted;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Sender name (in groups only) */}
        {!isOwn && isGroup && (
          <span className="text-xs font-medium text-blue-600 mb-1 px-2">
            {message.sender?.name}
          </span>
        )}

        <div
          className={`rounded-2xl ${isOwn
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100'
            } ${isImage ? 'p-1' : 'px-4 py-2'}`}
        >
          {isDeleted ? (
            <p className={`italic text-sm ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
              🚫 This message was deleted
            </p>
          ) : message.messageType === 'text' ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : message.messageType === 'file' && message.file ? (
            <>
              {/* Image Preview */}
              {isImage ? (
                <a href={message.file.url} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={message.file.url}
                    alt={message.file.name}
                    className="max-w-full rounded-xl max-h-64 object-cover cursor-pointer hover:opacity-90 transition"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  {/* Fallback if image fails */}
                  <div className="items-center gap-3 p-3" style={{ display: 'none' }}>
                    <span className="text-2xl">🖼️</span>
                    <span className="text-sm">{message.file.name}</span>
                  </div>
                </a>
              ) : (
                /* Non-image file */
                <a
                  href={message.file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 ${isOwn ? 'hover:opacity-80' : 'hover:bg-gray-50'
                    } p-2 rounded-lg transition`}
                >
                  <span className="text-3xl">{getFileIcon(message.file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{message.file.name}</p>
                    {message.file.size && (
                      <p className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                        {formatFileSize(message.file.size)}
                      </p>
                    )}
                  </div>
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              )}

              {/* Caption for images */}
              {isImage && message.file.name && (
                <div className={`px-3 py-1 ${isOwn ? '' : ''}`}>
                  <p className={`text-xs truncate ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                    {message.file.name}
                  </p>
                </div>
              )}
            </>
          ) : null}

          {/* Timestamp + Read status */}
          <div className={`flex items-center justify-end gap-1 ${isImage ? 'px-3 pb-1' : 'mt-1'}`}>
            <span className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
              {formatTime(message.createdAt)}
            </span>
            {isOwn && !isDeleted && (
              <span className={`text-xs ${message.readBy?.length > 1 ? 'text-blue-200' : 'text-blue-300'}`}>
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