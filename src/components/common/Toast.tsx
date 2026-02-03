import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return {
    success: (message: string, duration?: number) => context.addToast('success', message, duration),
    error: (message: string, duration?: number) => context.addToast('error', message, duration),
    info: (message: string, duration?: number) => context.addToast('info', message, duration),
    warning: (message: string, duration?: number) => context.addToast('warning', message, duration),
  };
}

export function ToastContainer() {
  const context = useContext(ToastContext);
  if (!context) return null;

  return (
    <div className="toast-container">
      {context.toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => context.removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastProps extends ToastItem {
  onClose: () => void;
}

export function Toast({ type, message, onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  };

  const bgColors = {
    success: 'bg-green-500/10 border-green-500/30',
    error: 'bg-red-500/10 border-red-500/30',
    info: 'bg-blue-500/10 border-blue-500/30',
    warning: 'bg-yellow-500/10 border-yellow-500/30',
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border
        ${bgColors[type]}
        bg-[var(--bg-secondary)]
        shadow-lg animate-slide-in
        min-w-[300px] max-w-[400px]
      `}
    >
      {icons[type]}
      <p className="flex-1 text-sm text-[var(--text-primary)]">{message}</p>
      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
