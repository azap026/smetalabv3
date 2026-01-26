'use client';
import React, { createContext, useContext, useCallback } from 'react';

const ToastContext = createContext({ toast: (opts: any) => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useCallback((opts: any) => {
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
