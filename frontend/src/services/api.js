import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Add token to requests automatically
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle token expiry — redirect to login on 401
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const registerUser = (userData) => API.post('/auth/register', userData);
export const loginUser = (credentials) => API.post('/auth/login', credentials);
export const getCurrentUser = () => API.get('/auth/me');
export const updateProfile = (profileData) => API.put('/auth/profile', profileData);
export const updateProfilePicture = (formData) => API.put('/auth/profile-picture', formData);
export const changePassword = (passwordData) => API.put('/auth/change-password', passwordData);
export const getApplicationHistory = () => API.get('/auth/applications');
export const verifyEmail = (token) => API.get(`/auth/verify-email/${token}`);

// Announcement APIs
export const createAnnouncement = (announcementData) => API.post('/announcements', announcementData);
export const getAnnouncements = (params) => API.get('/announcements', { params });
export const getAnnouncementById = (id) => API.get(`/announcements/${id}`);
export const markAnnouncementAsRead = (id) => API.put(`/announcements/${id}/read`);
export const updateAnnouncement = (id, announcementData) => API.put(`/announcements/${id}`, announcementData);
export const deleteAnnouncement = (id) => API.delete(`/announcements/${id}`);

// Company APIs
export const createCompany = (companyData) => API.post('/companies', companyData);
export const getCompanies = (params) => API.get('/companies', { params });
export const getCompanyById = (id) => API.get(`/companies/${id}`);
export const applyToCompany = (id) => API.post(`/companies/${id}/apply`);
export const updateCompany = (id, companyData) => API.put(`/companies/${id}`, companyData);
export const deleteCompany = (id) => API.delete(`/companies/${id}`);
export const exportApplicants = (id) => API.get(`/companies/${id}/export`);
export const closeExpiredCompanies = () => API.post('/companies/close-expired');

// Admin APIs
export const getAllUsers = (status) => API.get(`/admin/users${status ? `?status=${status}` : ''}`);
export const approveUser = (id) => API.put(`/admin/users/${id}/approve`);
export const deleteUser = (id) => API.delete(`/admin/users/${id}`);
export const updateUserRole = (id, data) => API.put(`/admin/users/${id}/role`, data);
export const getStatistics = () => API.get('/admin/statistics');

// Notification APIs
export const getNotifications = (params) => API.get('/notifications', { params });
export const markNotificationAsRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsAsRead = () => API.put('/notifications/read-all/all');
export const deleteNotification = (id) => API.delete(`/notifications/${id}`);

// Upload APIs — do NOT set Content-Type manually; Axios auto-sets it with boundary for FormData
export const uploadFile = (formData) => API.post('/upload', formData);
export const uploadMultipleFiles = (formData) => API.post('/upload/multiple', formData);
export const deleteFile = (filename) => API.delete(`/upload/${filename}`);

// Group APIs
export const createGroup = (groupData) => API.post('/groups', groupData);
export const getUserGroups = () => API.get('/groups/my-groups');
export const searchGroups = (params) => API.get('/groups/search', { params });
export const getGroupById = (id) => API.get(`/groups/${id}`);
export const joinGroup = (id) => API.post(`/groups/${id}/join`);
export const leaveGroup = (id) => API.post(`/groups/${id}/leave`);
export const approveJoinRequest = (id, userId) => API.post(`/groups/${id}/approve`, { userId });
export const removeMember = (id, userId) => API.post(`/groups/${id}/remove-member`, { userId });
export const makeAdmin = (id, userId) => API.post(`/groups/${id}/make-admin`, { userId });
export const removeAdmin = (id, userId) => API.post(`/groups/${id}/remove-admin`, { userId });
export const updateGroupSettings = (id, data) => API.put(`/groups/${id}/settings`, data);
export const deleteGroup = (id) => API.delete(`/groups/${id}`);

// Message APIs
export const getGroupMessages = (groupId, params) => API.get(`/messages/group/${groupId}`, { params });
export const getDirectMessages = (userId, params) => API.get(`/messages/direct/${userId}`, { params });
export const getConversations = () => API.get('/messages/conversations');
export const searchMessages = (params) => API.get('/messages/search', { params });
export const markMessagesAsRead = (messageIds) => API.post('/messages/mark-read', { messageIds });
export const deleteMessage = (id) => API.delete(`/messages/${id}`);
export const searchUsersForChat = (params) => API.get('/messages/users/search', { params });

export default API;
