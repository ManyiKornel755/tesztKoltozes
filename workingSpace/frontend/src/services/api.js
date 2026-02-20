import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Add Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 → localStorage clear + redirect /login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me')
};

// Users endpoints
export const users = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.patch('/users/me', data),
  updatePassword: (passwords) => api.patch('/users/me/password', passwords),
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

// Roles endpoints
export const roles = {
  getAll: () => api.get('/roles'),
  getById: (id) => api.get(`/roles/${id}`),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
  assignToUser: (roleId, userId) => api.post(`/roles/${roleId}/assign/${userId}`),
  removeFromUser: (roleId, userId) => api.delete(`/roles/${roleId}/assign/${userId}`),
  getUserRoles: (userId) => api.get(`/roles/user/${userId}`)
};

// Events endpoints
export const events = {
  getAll: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  addParticipant: (eventId, userId) => api.post(`/events/${eventId}/participants/${userId}`),
  removeParticipant: (eventId, userId) => api.delete(`/events/${eventId}/participants/${userId}`),
  register: (eventId) => api.post(`/events/${eventId}/register`),
  unregister: (eventId) => api.delete(`/events/${eventId}/register`)
};

// Messages endpoints
export const messages = {
  getAll: () => api.get('/messages'),
  getById: (id) => api.get(`/messages/${id}`),
  create: (data) => api.post('/messages', data),
  update: (id, data) => api.put(`/messages/${id}`, data),
  delete: (id) => api.delete(`/messages/${id}`),
  addRecipients: (messageId, userIds) => api.post(`/messages/${messageId}/recipients`, { userIds }),
  removeRecipient: (messageId, userId) => api.delete(`/messages/${messageId}/recipients/${userId}`),
  send: (messageId) => api.post(`/messages/${messageId}/send`)
};

// Transactions endpoints
export const transactions = {
  getAll: (filters) => api.get('/transactions', { params: filters }),
  getStats: () => api.get('/transactions/stats'),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`)
};

// User Documents endpoints
export const userDocuments = {
  preview: (userId, documentType) => api.post(`/user-documents/preview/${userId}`, { document_type: documentType }),
  generate: (userId, documentType) => api.post(`/user-documents/generate/${userId}`, { document_type: documentType }),
  getByUserId: (userId) => api.get(`/user-documents/${userId}`),
  download: (id) => {
    // For file downloads, we need to handle it differently
    const token = localStorage.getItem('token');
    window.open(`http://localhost:3000/api/user-documents/${id}/download?token=${token}`, '_blank');
  },
  delete: (id) => api.delete(`/user-documents/${id}`)
};

export default api;
