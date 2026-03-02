import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAnnouncements, createAnnouncement } from '../services/api';
import AnnouncementCard from '../components/common/AnnouncementCard';
import AnnouncementForm from '../components/common/AnnouncementForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import SearchBar from '../components/common/SearchBar';
import FilterBar from '../components/common/FilterBar';
import NotificationBell from '../components/common/NotificationBell';
import TnP from './TnP';
import AdminPanel from './AdminPanel';
import Profile from './Profile';
import Chat from './Chat';
import useDebounce from '../hooks/useDebounce';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const canCreateAnnouncement = ['teacher', 'tnp_admin', 'college_admin'].includes(user?.role);

  const priorityFilters = [
    { value: 'all', label: 'All' },
    { value: 'urgent', label: '🚨 Urgent' },
    { value: 'important', label: '⚠️ Important' },
    { value: 'normal', label: '📢 Normal' }
  ];

  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  useEffect(() => {
    if (activeTab === 'announcements') {
      fetchAnnouncements();
    }
  }, [activeTab, debouncedSearchTerm, priorityFilter]);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      const res = await getAnnouncements(params);
      setAnnouncements(res.data.data || res.data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, priorityFilter]);

  const handleCreateAnnouncement = async (announcementData) => {
    try {
      await createAnnouncement(announcementData);
      setShowCreateForm(false);
      fetchAnnouncements();
    } catch (err) {
      throw err;
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filter) => {
    setPriorityFilter(filter);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">College Platform</h1>
              <p className="text-xs text-gray-500">Your campus, connected</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              <NotificationBell />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">
                  {user?.role?.replace('_', ' ').toUpperCase()}
                  {user?.department && ` • ${user.department}`}
                  {user?.year && ` • Year ${user.year}`}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`py-4 px-2 font-medium border-b-2 transition ${activeTab === 'announcements'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              📢 Announcements
            </button>
            <button
              onClick={() => setActiveTab('tnp')}
              className={`py-4 px-2 font-medium border-b-2 transition ${activeTab === 'tnp'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              💼 Training & Placement
            </button>

            {/* ADD CHAT TAB */}
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-4 px-2 font-medium border-b-2 transition ${activeTab === 'chat'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              💬 Chat
            </button>

            {user?.role === 'college_admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-4 px-2 font-medium border-b-2 transition ${activeTab === 'admin'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                ⚙️ Admin Panel
              </button>
            )}

            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-2 font-medium border-b-2 transition ${activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              👤 Profile
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'announcements' ? (
          <>
            {canCreateAnnouncement && (
              <div className="mb-6">
                {!showCreateForm ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition font-medium shadow-sm"
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

            <div className="mb-6 space-y-4">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search announcements by title or description..."
              />
              <FilterBar
                filters={priorityFilters}
                activeFilter={priorityFilter}
                onFilterChange={handleFilterChange}
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                {user?.role === 'student' ? 'Your Announcements' : 'All Announcements'}
                {searchTerm && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (searching for "{searchTerm}")
                  </span>
                )}
              </h2>

              {loading ? (
                <LoadingSpinner message="Loading announcements..." />
              ) : announcements.length === 0 ? (
                <EmptyState
                  icon="📢"
                  title={searchTerm ? "No Results Found" : "No Announcements Yet"}
                  description={
                    searchTerm
                      ? `No announcements match "${searchTerm}"`
                      : canCreateAnnouncement
                        ? "Get started by creating your first announcement"
                        : "No announcements have been posted yet. Check back later!"
                  }
                  action={
                    canCreateAnnouncement && !showCreateForm && !searchTerm ? (
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
                      >
                        Create First Announcement
                      </button>
                    ) : null
                  }
                />
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
        ) : activeTab === 'tnp' ? (
          <TnP />
        ) : activeTab === 'chat' ? (
          <Chat />  // ADD THIS
        ) : activeTab === 'admin' ? (
          <AdminPanel />
        ) : activeTab === 'profile' ? (
          <Profile />
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard;