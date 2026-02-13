'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration || 3000,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start exit animation 200ms before actual removal
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, (toast.duration || 3000) - 300);

    return () => clearTimeout(timer);
  }, [toast.duration]);

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
          border: 'border-green-500',
          icon: <CheckCircle className="w-10 h-10 text-green-600" />,
          iconBg: 'bg-green-100',
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-50 to-rose-50',
          border: 'border-red-500',
          icon: <AlertCircle className="w-10 h-10 text-red-600" />,
          iconBg: 'bg-red-100',
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
          border: 'border-yellow-500',
          icon: <AlertTriangle className="w-10 h-10 text-yellow-600" />,
          iconBg: 'bg-yellow-100',
        };
      case 'info':
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
          border: 'border-blue-500',
          icon: <Info className="w-10 h-10 text-blue-600" />,
          iconBg: 'bg-blue-100',
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      className={`
        pointer-events-auto
        min-w-[420px] max-w-[500px]
        ${styles.bg}
        border-l-[6px] ${styles.border}
        rounded-2xl shadow-2xl
        p-6
        transform transition-all duration-300 ease-in-out
        ${isExiting
          ? 'translate-x-[600px] opacity-0 scale-95'
          : 'translate-x-0 opacity-100 scale-100 animate-slideInRight'
        }
      `}
    >
      <div className="flex items-start gap-5">
        {/* Icon */}
        <div className={`${styles.iconBg} rounded-2xl p-3 flex-shrink-0 shadow-md ring-2 ring-white`}>
          {styles.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-lg text-gray-700 leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white/50 rounded-lg"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' :
            toast.type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          } animate-shrink`}
          style={{ animationDuration: `${toast.duration}ms` }}
        />
      </div>
    </div>
  );
}
