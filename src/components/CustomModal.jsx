import React from 'react';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import './CustomModal.css';

const CustomModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', 
  confirmText = 'Okay', 
  cancelText = 'Cancel',
  onConfirm,
  showCancel = false,
  variant = 'default' // 'default' or 'discard'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 size={32} color="#10b981" />;
      case 'error': return <AlertCircle size={32} color="#ef4444" />;
      case 'warning': return <AlertCircle size={32} color="#f59e0b" />;
      default: return <Info size={32} color="var(--primary)" />;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content fade-in-scale" data-variant={variant}>
        <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        
        <div className="modal-header">
          <div className={`modal-icon-wrapper ${type}`}>
            {getIcon()}
          </div>
          <h3 className="modal-title">{title}</h3>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        
        <div className="modal-footer">
          {showCancel && variant === 'default' && (
            <button className="btn btn-outline modal-btn" onClick={onClose}>
              {cancelText}
            </button>
          )}

          {variant === 'discard' ? (
            <div className="discard-actions">
              <button className="btn btn-discard modal-btn" onClick={onConfirm}>
                {confirmText}
              </button>
              <button className="btn btn-outline modal-btn" onClick={onClose}>
                {cancelText}
              </button>
            </div>
          ) : (
            <button 
              className={`btn btn-primary modal-btn ${type === 'error' ? 'btn-error' : ''}`} 
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
