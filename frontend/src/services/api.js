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

// Auth APIs
export const registerUser = (userData) => API.post('/auth/register', userData);
export const loginUser = (credentials) => API.post('/auth/login', credentials);
export const getCurrentUser = () => API.get('/auth/me');
export const updateProfile = (profileData) => API.put('/auth/profile', profileData);  
export const changePassword = (passwordData) => API.put('/auth/change-password', passwordData); 
export const getApplicationHistory = () => API.get('/auth/applications'); 

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

export default API;