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

export const useNotifications = () => useContext(NotificationContext);
