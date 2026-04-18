import React, { useState } from 'react';
import useNotifications from '../context/useNotifications';
import './NotificationBell.css';

export default function NotificationBell() {
  const { normalNotifications, unreadNormalCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="notification-bell-container" onBlur={(e) => {
      // Close if click is outside
      if (!e.currentTarget.contains(e.relatedTarget)) {
        setIsOpen(false);
      }
    }}>
      <button 
        className="bell-button" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <i className="bi bi-bell-fill"></i>
        {unreadNormalCount > 0 && (
          <span className="bell-badge badge-animate">{unreadNormalCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown glass-panel fade-in">
          <div className="dropdown-header">
            <h4>Notifications</h4>
          </div>
          <div className="dropdown-body">
            {normalNotifications.length === 0 ? (
              <div className="empty-notifications">
                No new notifications.
              </div>
            ) : (
              normalNotifications.map(notification => (
                <div key={notification.id} className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}>
                  <div className="notification-content">
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <button 
                      className="mark-read-btn" 
                      onClick={() => markAsRead(notification.id)}
                      title="Mark as read"
                    >
                      <i className="bi bi-check2-all"></i>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
