import React from 'react';
import './ToastContainer.css';

export default function ToastContainer({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="region" aria-label="Notifications">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type || 'info'}`} role="status">
          <div className="toast-body">
            <div className="toast-title">
              {t.type === 'success' ? 'Success' : t.type === 'error' ? 'Error' : 'Info'}
            </div>
            <div className="toast-message">{t.message}</div>
          </div>
          <button className="toast-close" onClick={() => onClose(t.id)} aria-label="Close notification">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

