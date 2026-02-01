import { useState } from 'react';
import { uploadFile, uploadMultipleFiles, deleteFile } from '../../services/api';
import toast from 'react-hot-toast';

const FileUpload = ({ onFilesChange, maxFiles = 5, existingFiles = [] }) => {
  const [files, setFiles] = useState(existingFiles);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      
      if (selectedFiles.length === 1) {
        formData.append('file', selectedFiles[0]);
        const res = await uploadFile(formData);
        const newFiles = [...files, res.data];
        setFiles(newFiles);
        onFilesChange(newFiles);
        toast.success('File uploaded successfully');
      } else {
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        const res = await uploadMultipleFiles(formData);
        const newFiles = [...files, ...res.data];
        setFiles(newFiles);
        onFilesChange(newFiles);
        toast.success(`${selectedFiles.length} files uploaded successfully`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleFileRemove = async (index, filename) => {
    try {
      // Extract just the filename from URL if needed
      const fileToDelete = filename.split('/').pop();
      await deleteFile(fileToDelete);
      
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
      onFilesChange(newFiles);
      toast.success('File removed');
    } catch (err) {
      toast.error('Failed to remove file');
    }
  };

  const getFileIcon = (mimetype) => {
    if (mimetype?.includes('image')) return '🖼️';
    if (mimetype?.includes('pdf')) return '📄';
    if (mimetype?.includes('word')) return '📝';
    if (mimetype?.includes('excel') || mimetype?.includes('sheet')) return '📊';
    if (mimetype?.includes('powerpoint') || mimetype?.includes('presentation')) return '📽️';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Attachments (Optional)
      </label>

      {/* Upload Button */}
      <div className="mb-4">
        <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {uploading ? 'Uploading...' : 'Choose Files'}
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            disabled={uploading || files.length >= maxFiles}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          />
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Max {maxFiles} files. Supported: Images, PDF, Word, Excel, PowerPoint (Max 10MB each)
        </p>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md border"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{getFileIcon(file.mimetype)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.originalname || file.name}
                  </p>
                  {file.size && (
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleFileRemove(index, file.filename || file.url)}
                className="text-red-600 hover:text-red-800 ml-2"
                type="button"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;