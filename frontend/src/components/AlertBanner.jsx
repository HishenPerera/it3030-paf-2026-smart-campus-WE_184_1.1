import React from 'react';
import useNotifications from '../context/useNotifications';
import './AlertBanner.css';

export default function AlertBanner() {
  const { alerts, markAsRead } = useNotifications();

  if (!alerts || alerts.length === 0) {
    return null;
  }

  // We only show the latest alert on top, or stack them.
  // For simplicity, let's stack them if multiple exist.
  return (
    <div className="alert-banners-container">
      {alerts.map(alert => (
        <div key={alert.id} className="global-alert-banner slide-in-right">
          <div className="alert-icon">
            <i className="bi bi-exclamation-triangle-fill"></i>
          </div>
          <div className="alert-content">
            <strong>System Alert: </strong> {alert.message}
          </div>
          <button 
            className="alert-close-btn"
            onClick={() => markAsRead(alert.id)}
            aria-label="Dismiss Alert"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      ))}
    </div>
  );
}
