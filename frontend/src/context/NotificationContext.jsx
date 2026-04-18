import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../api/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const pollingRef = useRef(null);

  const fetchMyNotifications = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      // User may not be logged in yet — suppress noise
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(fetchMyNotifications, 10000);
  }, [fetchMyNotifications]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchMyNotifications();
    startPolling();
    return () => stopPolling();
  }, [fetchMyNotifications, startPolling, stopPolling]);

  // Lombok @Data on Boolean field "isRead" generates isRead() getter
  // → Jackson strips "is" prefix → serializes JSON key as "read" (not "isRead")
  // A notification is unread ONLY if neither key is explicitly true.
  const isUnread = (n) => n.isRead !== true && n.read !== true;

  const alerts = notifications.filter(n => n.type === 'ALERT' && isUnread(n));
  const normalNotifications = notifications.filter(n => n.type === 'NOTIFICATION');
  const unreadNormalCount = normalNotifications.filter(isUnread).length;

  const markAsRead = async (id) => {
    // Optimistic update first for instant UI feedback
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true, read: true } : n)
    );
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read', err);
      // Rollback optimistic update on failure
      await fetchMyNotifications();
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update for instant feedback
    setNotifications(prev =>
      prev.map(n => n.type === 'NOTIFICATION' ? { ...n, isRead: true, read: true } : n)
    );
    try {
      stopPolling();
      await markAllNotificationsRead();
      // Re-fetch from server to confirm DB write — this is the source of truth
      await fetchMyNotifications();
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
      await fetchMyNotifications(); // rollback via fresh fetch
    } finally {
      startPolling();
    }
  };

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
    <NotificationContext.Provider value={{
      notifications,
      alerts,
      normalNotifications,
      unreadNormalCount,
      markAsRead,
      markAllAsRead,
      fetchMyNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
