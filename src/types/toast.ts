export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number; // milliseconds (default 3000)
  action?: ToastAction;
  persistent?: boolean; // if true, won't auto-dismiss
}

export interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  showSuccess: (message: string, title?: string, action?: ToastAction) => string;
  showError: (message: string, title?: string, action?: ToastAction) => string;
  showWarning: (message: string, title?: string, action?: ToastAction) => string;
  showInfo: (message: string, title?: string, action?: ToastAction) => string;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
}

export type ToastType = Toast['type'];