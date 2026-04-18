import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNotifications } from '../context/NotificationContext';
import './NotificationBell.css';

export default function NotificationBell() {
  const { normalNotifications, unreadNormalCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const bellRef = useRef(null);

  // Recompute dropdown position whenever it opens
  useEffect(() => {
    if (isOpen && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
        zIndex: 999999,
      });
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        // Check if the click is inside the portal dropdown
        const portal = document.getElementById('notification-portal');
        if (portal && portal.contains(e.target)) return;
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const dropdown = isOpen && ReactDOM.createPortal(
    <div id="notification-portal" className="notification-dropdown glass-panel fade-in" style={dropdownStyle}>
      <div className="dropdown-header">
        <h4>Notifications</h4>
        {unreadNormalCount > 0 && (
          <button className="mark-all-btn" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>
      <div className="dropdown-body">
        {normalNotifications.length === 0 ? (
          <div className="empty-notifications">No new notifications.</div>
        ) : (
          normalNotifications.map(notification => {
            const isItemRead = notification.isRead === true || notification.read === true;
            return (
              <div key={notification.id} className={`notification-item ${isItemRead ? 'read' : 'unread'}`}>
                <div className="notification-content">
                  <p>{notification.message}</p>
                  <span className="notification-time">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
                {!isItemRead && (
                  <button
                    className="mark-read-btn"
                    onClick={() => markAsRead(notification.id)}
                    title="Mark as read"
                  >
                    <i className="bi bi-check2-all"></i>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>,
    document.body
  );

  return (
    <div className="notification-bell-container" ref={bellRef}>
      <button
        className="bell-button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Notifications"
      >
        <i className="bi bi-bell-fill"></i>
        {unreadNormalCount > 0 && (
          <span className="bell-badge badge-animate">{unreadNormalCount}</span>
        )}
      </button>
      {dropdown}
    </div>
  );
}
