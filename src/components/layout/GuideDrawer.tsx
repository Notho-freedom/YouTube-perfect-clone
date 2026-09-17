import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';
import { YouTubeLogo } from '../icons/YouTubeLogo';
import { GuideContent } from './GuideContent';

export function GuideDrawer() {
  const { drawerOpen, closeDrawer } = useApp();

  return (
    <AnimatePresence>
      {drawerOpen &&
      <>
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          onClick={closeDrawer}
          className="fixed inset-0 z-[60] bg-black/50"
          aria-hidden="true" />
        
          <motion.div
          initial={{ x: -240 }}
          animate={{ x: 0 }}
          exit={{ x: -240 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="yt-scroll fixed left-0 top-0 z-[61] h-full w-[240px] overflow-y-auto overflow-x-hidden bg-yt-bg"
          role="dialog"
          aria-label="Guide">
          
            <div className="sticky top-0 z-10 flex h-14 items-center gap-4 bg-yt-bg px-4">
              <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close guide"
              className="flex h-10 w-10 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
              
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
                  <path d="M21 6H3V5h18v1zm0 5H3v1h18v-1zm0 6H3v1h18v-1z" />
                </svg>
              </button>
              <Link to="/" onClick={closeDrawer} aria-label="YouTube Home">
                <YouTubeLogo />
              </Link>
            </div>
            <GuideContent />
          </motion.div>
        </>
      }
    </AnimatePresence>);

}