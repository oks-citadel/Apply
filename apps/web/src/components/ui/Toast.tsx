'use client';

import * as React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  message: string;
  variant: ToastVariant;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, variant, onClose }: ToastProps) {
  const variantStyles = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5" aria-hidden="true" />,
    error: <AlertCircle className="h-5 w-5" aria-hidden="true" />,
    warning: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
    info: <Info className="h-5 w-5" aria-hidden="true" />,
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right',
        variantStyles[variant]
      )}
      role="alert"
    >
      <div className="flex-shrink-0">{icons[variant]}</div>
      <div className="flex-1 text-sm font-medium">{message}</div>
      <button
        onClick={onClose}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
