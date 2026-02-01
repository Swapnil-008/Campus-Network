import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import FileUpload from './FileUpload';  

const AnnouncementForm = ({ onSubmit, onCancel }) => {
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visibilityType: 'department',
    departments: user?.department ? [user.department] : [],
    priority: 'normal',
    deadline: '',
    attachments: []  
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { title, description, visibilityType, departments, priority, deadline, attachments } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDepartmentChange = (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      departments: formData.departments.includes(value)
        ? formData.departments.filter(d => d !== value)
        : [...formData.departments, value]
    });
  };

  const handleFilesChange = (files) => {
    const attachments = files.map(file => ({
      name: file.originalname,
      url: `http://localhost:5000${file.url}`,
      type: file.mimetype
    }));
    setFormData({ ...formData, attachments });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (visibilityType === 'department' && departments.length === 0) {
      setError('Please select at least one department');
      return;
    }

    setLoading(true);

    const announcementData = {
      title,
      description,
      visibility: {
        type: visibilityType,
        departments: visibilityType === 'department' ? departments : []
      },
      priority,
      deadline: deadline || null,
      attachments 
    };

    try {
      await onSubmit(announcementData);
      setFormData({
        title: '',
        description: '',
        visibilityType: 'department',
        departments: user?.department ? [user.department] : [],
        priority: 'normal',
        deadline: '',
        attachments: []  
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Create Announcement</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={title}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter announcement title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            value={description}
            onChange={onChange}
            required
            rows="6"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter announcement details"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Visibility *
          </label>
          <select
            name="visibilityType"
            value={visibilityType}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="department">Department Specific</option>
            <option value="global">Global (All Departments)</option>
          </select>
        </div>

        {visibilityType === 'department' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Departments *
            </label>
            <div className="space-y-2">
              {['CS', 'IT', 'ENTC'].map((dept) => (
                <label key={dept} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={dept}
                    checked={departments.includes(dept)}
                    onChange={handleDepartmentChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{dept}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            name="priority"
            value={priority}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="normal">Normal</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deadline (Optional)
          </label>
          <input
            type="datetime-local"
            name="deadline"
            value={deadline}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* ADD FILE UPLOAD COMPONENT */}
        <FileUpload
          onFilesChange={handleFilesChange}
          maxFiles={5}
          existingFiles={attachments}
        />

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Creating...' : 'Create Announcement'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AnnouncementForm;