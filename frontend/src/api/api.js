import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
});

// // ── Halls ────────────────────────────────────────────────
// export const fetchHalls = () => api.get('/api/halls').then(r => r.data);
// export const fetchHall = (id) => api.get(`/api/halls/${id}`).then(r => r.data);
// export const fetchSeats = (hallId) => api.get(`/api/halls/${hallId}/seats`).then(r => r.data);

// ── User ─────────────────────────────────────────────────
export const fetchCurrentUser = () => api.get('/api/user/me').then(r => r.data);
export const fetchAllUsers = () => api.get('/api/admin/users').then(r => r.data);
export const updateUserRole = (id, role) => api.put(`/api/admin/users/${id}/role`, { role }).then(r => r.data);

// // ── Notifications ────────────────────────────────────────
// export const fetchNotifications = () => api.get('/api/notifications').then(r => r.data);
// export const markNotificationRead = (id) => api.put(`/api/notifications/${id}/read`).then(r => r.data);
// export const deleteNotification = (id) => api.delete(`/api/notifications/${id}`).then(r => r.data);

// // ── Bookings ─────────────────────────────────────────────
// export const fetchMyBookings = () => api.get('/api/bookings').then(r => r.data);
// export const fetchAllBookings = () => api.get('/api/bookings/all').then(r => r.data);
// export const createBooking = (seatId, eventDate) =>
//   api.post('/api/bookings', { seatId, eventDate }).then(r => r.data);
// export const cancelBooking = (id) => api.delete(`/api/bookings/${id}`).then(r => r.data);

// ── Auth ─────────────────────────────────────────────────
export const loginWithGoogle = () => {
  window.location.href = 'http://localhost:8080/oauth2/authorization/google';
};
export const logout = () => api.post('/api/logout').then(r => r.data);

export default api;
