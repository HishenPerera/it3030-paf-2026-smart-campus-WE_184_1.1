import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchNotifications, markNotificationRead } from '../api/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  
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
    // Initial fetch
    fetchMyNotifications();

    // Poll every 10 seconds
    const interval = setInterval(fetchMyNotifications, 10000);
    return () => clearInterval(interval);
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

  return (
    <NotificationContext.Provider value={{ notifications, alerts, normalNotifications, unreadNormalCount, markAsRead, fetchMyNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
