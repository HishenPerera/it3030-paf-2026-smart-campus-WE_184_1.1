import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
});

// ── Resources ─────────────────────────────────────────────
export const fetchResources = (params) => api.get('/api/resources', { params }).then(r => r.data);
export const createResource = (data) => api.post('/api/resources', data).then(r => r.data);
export const updateResource = (id, data) => api.put(`/api/resources/${id}`, data).then(r => r.data);
export const deleteResource = (id) => api.delete(`/api/resources/${id}`).then(r => r.data);

// ── Reservations ──────────────────────────────────────────
export const fetchMyReservations = () => api.get('/api/reservations/my').then(r => r.data);
export const fetchAllReservations = () => api.get('/api/reservations/admin/all').then(r => r.data);
export const fetchAvailability = (date, startTime, endTime) =>
  api.get('/api/reservations/availability', { params: { date, startTime, endTime } }).then(r => r.data);
export const createReservation = (data) => api.post('/api/reservations', data).then(r => r.data);
export const confirmReservation = (id) => api.post(`/api/reservations/${id}/confirm`).then(r => r.data);
export const cancelReservation = (id, reason = '') => api.delete(`/api/reservations/${id}`, { data: { reason } }).then(r => r.data);

// ── User ─────────────────────────────────────────────────
export const fetchCurrentUser = () => api.get('/api/user/me').then(r => r.data);
export const fetchAllUsers = () => api.get('/api/admin/users').then(r => r.data);
export const fetchTechnicians = () => api.get('/api/admin/technicians').then(r => r.data);
export const updateUserRole = (id, role) => api.put(`/api/admin/users/${id}/role`, { role }).then(r => r.data);
export const fetchDashboardStats = () => api.get('/api/tickets/statistics').then(r => r.data);

// ── Notifications ────────────────────────────────────────
export const fetchNotifications = () => api.get('/api/notifications').then(r => r.data);
export const markNotificationRead = (id) => api.put(`/api/notifications/${id}/read`).then(r => r.data);
export const markAllNotificationsRead = () => api.put('/api/notifications/read-all').then(r => r.data);
export const sendNotification = (payload) => api.post('/api/notifications/send', payload).then(r => r.data);
export const fetchNotificationBatches = () => api.get('/api/notifications/batches').then(r => r.data);
export const deleteNotificationBatch = (batchId) => api.delete(`/api/notifications/batches/${batchId}`).then(r => r.data);

// ── Tickets ──────────────────────────────────────────────
export const fetchTickets = (params) => {
  // Rename technicianId → assignedTechnicianId to match the backend param name
  const mapped = { ...params };
  if (mapped.technicianId !== undefined) {
    mapped.assignedTechnicianId = mapped.technicianId;
    delete mapped.technicianId;
  }
  return api.get('/api/tickets', { params: mapped }).then(r => r.data);
};
export const fetchTicketById = (id) => api.get(`/api/tickets/${id}`).then(r => r.data);
export const updateTicketStatus = (ticketId, payload) => api.put(`/api/tickets/${ticketId}/status`, payload).then(r => r.data);
export const assignTechnician = (ticketId, technicianId) => api.put(`/api/tickets/${ticketId}/assign`, { technicianId }).then(r => r.data);
export const deleteTicketAttachment = (ticketId, imageUrl) => api.delete(`/api/tickets/${ticketId}/attachments`, { params: { imageUrl } }).then(r => r.data);
export const createTicket = (formData) => api.post('/api/tickets', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
}).then(r => r.data);

// ── Comments ──────────────────────────────────────────────
export const fetchComments = (ticketId) => api.get(`/api/tickets/${ticketId}/comments`).then(r => r.data);
export const addComment = (ticketId, content) => api.post(`/api/tickets/${ticketId}/comments`, { content }).then(r => r.data);
export const updateComment = (ticketId, commentId, content) => api.put(`/api/tickets/${ticketId}/comments/${commentId}`, { content }).then(r => r.data);
export const deleteComment = (ticketId, commentId) => api.delete(`/api/tickets/${ticketId}/comments/${commentId}`).then(r => r.data);

// ── Auth ─────────────────────────────────────────────────
export const loginWithGoogle = () => {
  window.location.href = 'http://localhost:8080/oauth2/authorization/google';
};
export const logout = () => api.post('/api/logout').then(r => r.data);

export default api;
// Axios base configured for API connectivity
