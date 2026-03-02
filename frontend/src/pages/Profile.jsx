import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { updateProfile, changePassword, getApplicationHistory, updateProfilePicture } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, loadUser } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [uploadingPic, setUploadingPic] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.replace('/api', '');

  // Profile form
  const [profileData, setProfileData] = useState({
    name: '',
    department: '',
    year: '',
    cgpa: ''
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        department: user.department || '',
        year: user.year || '',
        cgpa: user.cgpa || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeSection === 'applications' && user?.role === 'student') {
      fetchApplications();
    }
  }, [activeSection, user]);

  const fetchApplications = async () => {
    setApplicationsLoading(true);
    try {
      const res = await getApplicationHistory();
      setApplications(res.data);
    } catch (err) {
      toast.error('Failed to load application history');
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(profileData);
      await loadUser(); // Refresh user data
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveSection('profile')}
            className={`px-6 py-3 font-medium transition ${activeSection === 'profile'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            👤 Profile Info
          </button>
          <button
            onClick={() => setActiveSection('password')}
            className={`px-6 py-3 font-medium transition ${activeSection === 'password'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            🔒 Change Password
          </button>
          {user?.role === 'student' && (
            <button
              onClick={() => setActiveSection('applications')}
              className={`px-6 py-3 font-medium transition ${activeSection === 'applications'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              📝 Application History
            </button>
          )}
        </div>
      </div>

      {/* Profile Info Section */}
      {activeSection === 'profile' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Profile Information</h2>

          {/* Profile Picture Upload */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group">
              {user?.profilePicture ? (
                <img
                  src={`${baseUrl}${user.profilePicture}`}
                  alt={user?.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingPic}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setUploadingPic(true);
                    try {
                      const formData = new FormData();
                      formData.append('profilePicture', file);
                      await updateProfilePicture(formData);
                      await loadUser();
                      toast.success('Profile picture updated!');
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to upload');
                    } finally {
                      setUploadingPic(false);
                    }
                    e.target.value = '';
                  }}
                />
                {uploadingPic ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="text-white text-sm">📷</span>
                )}
              </label>
            </div>
            <div>
              <p className="font-medium text-gray-700">{user?.name}</p>
              <p className="text-sm text-gray-500">Click avatar to change photo</p>
            </div>
          </div>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <input
                type="text"
                value={user?.role?.replace('_', ' ').toUpperCase()}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            {user?.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    name="department"
                    value={profileData.department}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CS">Computer Science (CS)</option>
                    <option value="IT">Information Technology (IT)</option>
                    <option value="ENTC">Electronics & Telecommunication (ENTC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <select
                    name="year"
                    value={profileData.year}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">First Year</option>
                    <option value="2">Second Year</option>
                    <option value="3">Third Year</option>
                    <option value="4">Fourth Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CGPA
                  </label>
                  <input
                    type="number"
                    name="cgpa"
                    value={profileData.cgpa}
                    onChange={handleProfileChange}
                    step="0.01"
                    min="0"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {(user?.role === 'teacher' || user?.role === 'tnp_admin') && user?.department && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={user.department}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Change Password Section */}
      {activeSection === 'password' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Change Password</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password *
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password *
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {/* Application History Section */}
      {activeSection === 'applications' && user?.role === 'student' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Application History</h2>

          {applicationsLoading ? (
            <LoadingSpinner message="Loading applications..." />
          ) : applications.length === 0 ? (
            <EmptyState
              icon="📝"
              title="No Applications Yet"
              description="You haven't applied to any companies yet. Check the TnP section for available opportunities!"
            />
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{app.companyName}</h3>
                      <p className="text-gray-600">{app.role}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${app.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {app.status === 'open' ? '✅ Open' : '⏰ Closed'}
                    </span>
                  </div>

                  {app.packageOffered && (
                    <p className="text-sm text-green-600 font-semibold mb-2">
                      ₹{app.packageOffered.min}L - ₹{app.packageOffered.max}L
                    </p>
                  )}

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Applied on:</strong>{' '}
                      {new Date(app.appliedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p>
                      <strong>Deadline:</strong>{' '}
                      {new Date(app.deadline).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;