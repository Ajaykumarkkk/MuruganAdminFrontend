import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  X 
} from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import './PrettyAlert.css';

const PrettyAlert = () => {
  const { alert, closeAlert } = useAlert();
  const [isClosing, setIsClosing] = useState(false);

  if (!alert) return null;

  const handleConfirm = () => {
    if (alert.onConfirm) alert.onConfirm();
    handleClose();
  };

  const handleCancel = () => {
    if (alert.onCancel) alert.onCancel();
    handleClose();
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      closeAlert();
      setIsClosing(false);
    }, 300); // Wait for fade-out animation
  };

  const getIcon = () => {
    switch (alert.type) {
      case 'success': 
        return { 
          icon: <CheckCircle2 size={32} />, 
          bgColor: '#f0fdf4', 
          color: '#10b981' 
        };
      case 'error': 
        return { 
          icon: <AlertCircle size={32} />, 
          bgColor: '#fef2f2', 
          color: '#ef4444' 
        };
      case 'warning': 
        return { 
          icon: <AlertTriangle size={32} />, 
          bgColor: '#fffbfa', 
          color: '#f59e0b' 
        };
      default: 
        return { 
          icon: <Info size={32} />, 
          bgColor: '#f0f9ff', 
          color: 'var(--primary)' 
        };
    }
  };

  const iconData = getIcon();

  return (
    <div className={`pretty-alert-overlay ${isClosing ? 'exit' : ''}`} onClick={handleClose}>
      <div 
        className={`pretty-alert-card ${isClosing ? 'exit' : ''}`} 
        onClick={(e) => e.stopPropagation()}
        data-variant={alert.variant}
      >
        <button className="pretty-alert-close" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="pretty-alert-glow"></div>
        
        <div className="pretty-alert-content">
          <div 
            className="pretty-alert-icon-wrapper" 
            style={{ backgroundColor: iconData.bgColor, color: iconData.color }}
          >
            {iconData.icon}
          </div>

          <h3 className="pretty-alert-title">{alert.title}</h3>
          <p className="pretty-alert-message">{alert.message}</p>

          <div className="pretty-alert-actions">
            {alert.variant === 'discard' ? (
              <>
                <button 
                  className="pretty-alert-btn btn-discard-primary" 
                  onClick={handleConfirm}
                >
                  {alert.confirmText.toUpperCase()}
                </button>
                <button 
                  className="pretty-alert-btn btn-discard-secondary" 
                  onClick={handleCancel}
                >
                  {alert.cancelText.toUpperCase()}
                </button>
              </>
            ) : (
              <>
                {alert.showCancel && (
                  <button className="pretty-alert-btn btn-cancel" onClick={handleCancel}>
                    {alert.cancelText}
                  </button>
                )}
                <button 
                  className={`pretty-alert-btn btn-confirm ${alert.type}`} 
                  onClick={handleConfirm}
                >
                  {alert.confirmText}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrettyAlert;
