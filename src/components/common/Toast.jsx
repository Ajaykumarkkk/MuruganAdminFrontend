import React from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

import './Toast.css';

const Toast = ({ id, message, type }) => {
  const { removeToast } = useToast();

  const config = {
    success: { icon: <CheckCircle size={20} /> },
    error: { icon: <AlertCircle size={20} /> },
    warning: { icon: <AlertTriangle size={20} /> },
    info: { icon: <Info size={20} /> },
  };

  const current = config[type] || config.info;

  return (
    <div className={`toast-item slide-in toast-${type}`}>
      <div className="toast-icon-wrapper">
        {current.icon}
      </div>
      <div className="toast-message">
        {message}
      </div>
      <button 
        onClick={() => removeToast(id)}
        className="toast-close-btn"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const { toasts } = useToast();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};
