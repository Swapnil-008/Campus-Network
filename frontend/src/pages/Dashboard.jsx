import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAnnouncements, createAnnouncement } from '../services/api';
import AnnouncementCard from '../components/common/AnnouncementCard';
import AnnouncementForm from '../components/common/AnnouncementForm';
import TnP from './TnP';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('announcements'); // 'announcements' or 'tnp'
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const canCreateAnnouncement = ['teacher', 'tnp_admin', 'college_admin'].includes(user?.role);

  useEffect(() => {
    if (activeTab === 'announcements') {
      fetchAnnouncements();
    }
  }, [activeTab]);

  const fetchAnnouncements = async () => {
    try {
      const res = await getAnnouncements();
      setAnnouncements(res.data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (announcementData) => {
    try {
      await createAnnouncement(announcementData);
      setShowCreateForm(false);
      fetchAnnouncements();
    } catch (err) {
      throw err;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">College Platform</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">
                {user?.role} {user?.department && `• ${user.department}`}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`py-4 px-2 font-medium border-b-2 transition ${
                activeTab === 'announcements'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📢 Announcements
            </button>
            <button
              onClick={() => setActiveTab('tnp')}
              className={`py-4 px-2 font-medium border-b-2 transition ${
                activeTab === 'tnp'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              💼 Training & Placement
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'announcements' ? (
          <>
            {/* Create Announcement Button */}
            {canCreateAnnouncement && (
              <div className="mb-6">
                {!showCreateForm ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition font-medium"
                  >
                    + Create Announcement
                  </button>
                ) : (
                  <AnnouncementForm
                    onSubmit={handleCreateAnnouncement}
                    onCancel={() => setShowCreateForm(false)}
                  />
                )}
              </div>
            )}

            {/* Announcements List */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Announcements</h2>

              {loading ? (
                <div className="text-center py-12">
                  <div className="text-xl text-gray-600">Loading announcements...</div>
                </div>
              ) : announcements.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <p className="text-gray-500 text-lg">No announcements yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <AnnouncementCard
                      key={announcement._id}
                      announcement={announcement}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <TnP />
        )}
      </div>
    </div>
  );
};

export default Dashboard;