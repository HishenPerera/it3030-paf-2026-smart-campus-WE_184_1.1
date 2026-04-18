import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { fetchNotifications, markNotificationRead } from '../api/api';
import ToastContainer from '../components/ToastContainer';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  
  const fetchMyNotifications = async () => {
    try {
      const data = await fetchNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    // Initial fetch (async to satisfy strict hooks lint)
    const t = setTimeout(fetchMyNotifications, 0);

    // Poll every 10 seconds
    const interval = setInterval(fetchMyNotifications, 10000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, []);

  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const alerts = notifications.filter(n => n.type === 'ALERT' && !n.isRead);
  const normalNotifications = notifications.filter(n => n.type === 'NOTIFICATION');
  const unreadNormalCount = normalNotifications.filter(n => !n.isRead).length;

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showNotification = useCallback((message, type = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const normalizedType = (type || 'info').toLowerCase();
    const toast = { id, message, type: normalizedType };
    setToasts(prev => [toast, ...prev].slice(0, 5));

    // Auto-dismiss after 3.5s (errors stick slightly longer)
    const ttl = normalizedType === 'error' ? 5500 : 3500;
    window.setTimeout(() => removeToast(id), ttl);
  }, []);

  const value = useMemo(() => ({
    notifications,
    alerts,
    normalNotifications,
    unreadNormalCount,
    markAsRead,
    fetchMyNotifications,
    showNotification
  }), [notifications, alerts, normalNotifications, unreadNormalCount, showNotification]);

  return (
    <NotificationContext.Provider value={value}>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
