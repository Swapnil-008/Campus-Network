import { useState, useContext } from 'react';
import { SocketContext } from '../../context/SocketContext';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const MessageBubble = ({ message, isOwn, isGroup, onReply, onEdit }) => {
  const { socket } = useContext(SocketContext);
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || '');

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
    if (type?.includes('text')) return '📃';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleReact = (emoji) => {
    if (!socket) return;
    socket.emit('message:react', { messageId: message._id, emoji });
    setShowReactions(false);
    setShowActions(false);
  };

  const handleEdit = () => {
    if (!socket || !editText.trim()) return;
    socket.emit('message:edit', { messageId: message._id, newContent: editText.trim() });
    setEditing(false);
    setShowActions(false);
  };

  const isImage = message.file?.type?.includes('image');
  const isDeleted = message.isDeleted;
  const senderName = message.sender?.name || 'Unknown';
  const profilePic = message.sender?.profilePicture;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.replace('/api', '');

  // Group reactions by emoji
  const groupedReactions = {};
  (message.reactions || []).forEach(r => {
    if (!groupedReactions[r.emoji]) groupedReactions[r.emoji] = [];
    groupedReactions[r.emoji].push(r.user);
  });

  // Read receipt status for own messages
  const getReadStatus = () => {
    if (!isOwn || isDeleted) return null;
    const readCount = message.readBy?.length || 0;
    const delivered = message.deliveredTo?.length || 0;
    if (readCount > (isGroup ? 0 : 1)) {
      return <span className="text-blue-300 text-xs ml-1">✓✓</span>;
    }
    if (delivered > 0 || readCount > 0) {
      return <span className="text-blue-200 text-xs ml-1">✓✓</span>;
    }
    return <span className="text-blue-200 text-xs ml-1">✓</span>;
  };

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => !isDeleted && setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false); }}
    >
      {/* Avatar for others */}
      {!isOwn && (
        <div className="w-8 h-8 rounded-full shrink-0 mr-2 mt-1 overflow-hidden">
          {profilePic ? (
            <img src={`${baseUrl}${profilePic}`} alt={senderName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {senderName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col relative`}>
        {/* Sender name (in groups) */}
        {!isOwn && isGroup && (
          <span className="text-xs font-medium text-blue-600 mb-1 px-2">{senderName}</span>
        )}

        {/* Reply preview */}
        {message.replyTo && !isDeleted && (
          <div className={`text-xs px-3 py-1 mb-1 rounded-lg border-l-2 ${isOwn ? 'bg-blue-500/30 border-blue-300 text-blue-100' : 'bg-gray-100 border-gray-400 text-gray-600'
            }`}>
            <span className="font-medium">{message.replyTo.sender?.name || 'User'}</span>
            <p className="truncate">{message.replyTo.content || '📎 File'}</p>
          </div>
        )}

        {/* Action buttons (hover) */}
        {showActions && !editing && (
          <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex items-center gap-1 px-1 z-10`}>
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="text-gray-400 hover:text-gray-600 text-sm p-1 rounded hover:bg-gray-100"
              title="React"
            >😊</button>
            {onReply && (
              <button
                onClick={() => onReply(message)}
                className="text-gray-400 hover:text-gray-600 text-sm p-1 rounded hover:bg-gray-100"
                title="Reply"
              >↩️</button>
            )}
            {isOwn && message.messageType === 'text' && (
              <button
                onClick={() => { setEditing(true); setEditText(message.content); }}
                className="text-gray-400 hover:text-gray-600 text-sm p-1 rounded hover:bg-gray-100"
                title="Edit"
              >✏️</button>
            )}
          </div>
        )}

        {/* Emoji picker */}
        {showReactions && (
          <div className={`absolute -top-10 ${isOwn ? 'right-0' : 'left-0'} bg-white shadow-lg rounded-full px-2 py-1 flex gap-1 border z-20`}>
            {REACTION_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="text-lg hover:scale-125 transition-transform p-0.5"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Message bubble */}
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
          ) : editing ? (
            <div className="flex gap-2 items-center">
              <input
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') setEditing(false); }}
                className="flex-1 bg-blue-500/30 text-white px-2 py-1 rounded text-sm outline-none placeholder-blue-200"
                autoFocus
              />
              <button onClick={handleEdit} className="text-xs bg-white/20 px-2 py-1 rounded">✓</button>
              <button onClick={() => setEditing(false)} className="text-xs bg-white/20 px-2 py-1 rounded">✕</button>
            </div>
          ) : message.messageType === 'text' ? (
            <div>
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              {message.editedAt && (
                <span className={`text-xs italic ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>(edited)</span>
              )}
            </div>
          ) : message.messageType === 'file' && message.file ? (
            <>
              {isImage ? (
                <a href={message.file.url} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={message.file.url}
                    alt={message.file.name}
                    className="max-w-full rounded-xl max-h-64 object-cover cursor-pointer hover:opacity-90 transition"
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </a>
              ) : (
                <a
                  href={message.file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 ${isOwn ? 'hover:opacity-80' : 'hover:bg-gray-50'} p-2 rounded-lg transition`}
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
            </>
          ) : null}

          {/* Timestamp + Read receipts */}
          <div className={`flex items-center justify-end gap-1 ${isImage ? 'px-3 pb-1' : 'mt-1'}`}>
            <span className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
              {formatTime(message.createdAt)}
            </span>
            {getReadStatus()}
          </div>
        </div>

        {/* Reactions display */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 px-2">
            {Object.entries(groupedReactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 transition border border-gray-200"
              >
                <span>{emoji}</span>
                <span className="text-gray-600">{users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;