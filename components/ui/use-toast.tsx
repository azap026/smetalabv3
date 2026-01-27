'use client';
import React, { createContext, useContext, useCallback } from 'react';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

const ToastContext = createContext<{
  toast: (opts: ToastOptions) => void;
}>({
  toast: () => { },
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useCallback((opts: ToastOptions) => {
    // This is a placeholder implementation.
    // In a real app, this would trigger a visual toast notification.
    console.log('[Toast]:', opts.title, opts.description);
  }, []);
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
