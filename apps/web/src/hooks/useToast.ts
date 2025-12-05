import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// This is a simple implementation. You can replace it with your toast context
export function useToast() {
  const toast = useCallback(
    ({ title, description, variant = 'info', duration = 5000 }: Omit<Toast, 'id'>) => {
      // In a real implementation, this would use a toast context or library
      // For now, we'll use console for demonstration
      console.log(`[${variant.toUpperCase()}] ${title}`, description);

      // You can implement the actual toast UI using your toast provider
      // Example: dispatch a toast event, add to toast context, etc.
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { title, description, variant, duration },
          })
        );
      }
    },
    []
  );

  return { toast };
}
