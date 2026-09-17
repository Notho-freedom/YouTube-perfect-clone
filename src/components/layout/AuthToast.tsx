import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function AuthToast() {
  const { authMessage, dismissMessage } = useAuth();

  return (
    <AnimatePresence>
      {authMessage &&
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        role="status"
        className="fixed bottom-6 left-6 z-[70] flex max-w-[420px] items-start gap-3 rounded-xl bg-[#373737] px-4 py-3 text-[14px] leading-5 text-white shadow-[0_4px_32px_rgba(0,0,0,0.35)]">
        
          <p className="flex-1 break-words">{authMessage}</p>
          <button
          type="button"
          onClick={dismissMessage}
          aria-label="Dismiss"
          className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/15">
          
            <XIcon className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </motion.div>
      }
    </AnimatePresence>);

}