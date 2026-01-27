import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
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

// Announcement APIs
export const createAnnouncement = (announcementData) => API.post('/announcements', announcementData);
export const getAnnouncements = () => API.get('/announcements');
export const getAnnouncementById = (id) => API.get(`/announcements/${id}`);
export const markAnnouncementAsRead = (id) => API.put(`/announcements/${id}/read`);
export const updateAnnouncement = (id, announcementData) => API.put(`/announcements/${id}`, announcementData);
export const deleteAnnouncement = (id) => API.delete(`/announcements/${id}`);

// Company APIs
export const createCompany = (companyData) => API.post('/companies', companyData);
export const getCompanies = () => API.get('/companies');
export const getCompanyById = (id) => API.get(`/companies/${id}`);
export const applyToCompany = (id) => API.post(`/companies/${id}/apply`);
export const updateCompany = (id, companyData) => API.put(`/companies/${id}`, companyData);
export const deleteCompany = (id) => API.delete(`/companies/${id}`);
export const exportApplicants = (id) => API.get(`/companies/${id}/export`);
export const closeExpiredCompanies = () => API.post('/companies/close-expired');

export default API;