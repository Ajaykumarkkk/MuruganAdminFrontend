import React, { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within an AlertProvider');
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((options) => {
    setAlert({
      isOpen: true,
      title: options.title || 'Alert',
      message: options.message || '',
      type: options.type || 'info', // 'info', 'success', 'warning', 'error'
      confirmText: options.confirmText || 'Okay',
      cancelText: options.cancelText || 'Cancel',
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null,
      showCancel: options.showCancel || false,
      variant: options.variant || 'default' // 'default' or 'discard'
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlert(null);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert, alert }}>
      {children}
    </AlertContext.Provider>
  );
};
