import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ToastContextValue {
  showToast: (message: string, action?: {label: string;onSelect: () => void;}) => void;
}

interface ToastState {
  id: number;
  message: string;
  action?: {label: string;onSelect: () => void;};
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: {children: React.ReactNode;}) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | null>(null);

  const showToast = useCallback<ToastContextValue['showToast']>((message, action) => {
    if (timer.current) window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message, action });
    timer.current = window.setTimeout(() => setToast(null), 4000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {toast &&
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          role="status"
          className="fixed bottom-6 left-6 z-[80] flex max-w-[420px] items-center gap-6 rounded bg-[#373737] px-4 py-3 text-[14px] leading-5 text-white shadow-[0_4px_32px_rgba(0,0,0,0.35)]">
          
            <span className="flex-1">{toast.message}</span>
            {toast.action &&
          <button
            type="button"
            onClick={() => {
              toast.action?.onSelect();
              setToast(null);
            }}
            className="shrink-0 text-[14px] font-medium uppercase tracking-wide text-[#3ea6ff]">
            
                {toast.action.label}
              </button>
          }
          </motion.div>
        }
      </AnimatePresence>
    </ToastContext.Provider>);

}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a ToastProvider');
  return context;
}