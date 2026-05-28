import React, { createContext, useContext, useState, useCallback } from 'react';
import './Toast.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 4000ms
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" aria-live="assertive">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item ${toast.type} animate-toast-slide`}>
            <span className="material-symbols-outlined toast-icon">
              {toast.type === 'success' && 'check_circle'}
              {toast.type === 'error' && 'error'}
              {toast.type === 'warning' && 'warning'}
              {toast.type === 'info' && 'info'}
            </span>
            <p className="toast-message">{toast.message}</p>
            <button className="toast-close-btn" onClick={() => removeToast(toast.id)} aria-label="Close notification">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
