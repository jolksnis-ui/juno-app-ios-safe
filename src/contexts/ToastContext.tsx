import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastContextType, ToastAction } from '../types/toast';

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Generate unique toast ID
  const generateId = useCallback((): string => {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Auto-dismiss toast after duration
  const scheduleAutoDismiss = useCallback((id: string, duration: number) => {
    setTimeout(() => {
      hideToast(id);
    }, duration);
  }, []);

  // Show generic toast
  const showToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = generateId();
    const newToast: Toast = {
      id,
      duration: 3000, // default 3 seconds
      ...toast,
    };

    setToasts(prev => {
      // Limit to max 3 toasts visible at once
      const updatedToasts = [...prev, newToast];
      return updatedToasts.slice(-3);
    });

    // Auto-dismiss if not persistent
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      scheduleAutoDismiss(id, newToast.duration);
    }

    return id;
  }, [generateId, scheduleAutoDismiss]);

  // Convenience methods for different toast types
  const showSuccess = useCallback((message: string, title?: string, action?: ToastAction): string => {
    return showToast({
      type: 'success',
      title,
      message,
      action,
    });
  }, [showToast]);

  const showError = useCallback((message: string, title?: string, action?: ToastAction): string => {
    return showToast({
      type: 'error',
      title,
      message,
      action,
      // Error toasts stay longer by default
      duration: 4000,
    });
  }, [showToast]);

  const showWarning = useCallback((message: string, title?: string, action?: ToastAction): string => {
    return showToast({
      type: 'warning',
      title,
      message,
      action,
    });
  }, [showToast]);

  const showInfo = useCallback((message: string, title?: string, action?: ToastAction): string => {
    return showToast({
      type: 'info',
      title,
      message,
      action,
    });
  }, [showToast]);

  // Hide specific toast
  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Hide all toasts
  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
    hideAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};