import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { EllipsisVerticalIcon, GlobeIcon, KeyboardIcon, MapPinIcon, MessageSquareWarningIcon, MoonIcon, SettingsIcon, ShieldCheckIcon, SunIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';
import { KeyboardShortcuts } from './KeyboardShortcuts';
export function HeaderMenu() {
  const {
    theme,
    toggleTheme,
    locale,
    setLocale
  } = useApp();
  const {
    showToast
  } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const language = locale === 'fr' ? 'Français' : 'English';
  const region = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()?.replace(/_/g, ' ') ?? 'Worldwide' : 'Worldwide';
  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);
  const items = [{
    icon: theme === 'dark' ? <MoonIcon className="h-6 w-6" strokeWidth={1.8} /> : <SunIcon className="h-6 w-6" strokeWidth={1.8} />,
    label: `Appearance: ${theme === 'dark' ? 'Dark' : 'Light'}`,
    action: toggleTheme
  }, {
    icon: <GlobeIcon className="h-6 w-6" strokeWidth={1.8} />,
    label: `Language: ${language}`,
    action: () => {
      const next = locale === 'fr' ? 'en' : 'fr';
      setLocale(next);
      showToast(next === 'fr' ? 'Langue : Français' : 'Language: English');
    }
  }, {
    icon: <MapPinIcon className="h-6 w-6" strokeWidth={1.8} />,
    label: `Location: ${region}`,
    action: () => go('/settings')
  }, {
    icon: <ShieldCheckIcon className="h-6 w-6" strokeWidth={1.8} />,
    label: 'Your data in YouTube',
    action: () => go('/settings')
  }, {
    icon: <SettingsIcon className="h-6 w-6" strokeWidth={1.8} />,
    label: 'Settings',
    action: () => go('/settings')
  }, {
    icon: <div className="h-6 w-6" strokeWidth={1.8} />,
    label: 'Help',
    action: () => {
      setOpen(false);
      window.open('https://support.google.com/youtube', '_blank', 'noopener,noreferrer');
    }
  }, {
    icon: <MessageSquareWarningIcon className="h-6 w-6" strokeWidth={1.8} />,
    label: 'Send feedback',
    action: () => {
      setOpen(false);
      showToast('Feedback is outside this clone');
    }
  }, {
    icon: <KeyboardIcon className="h-6 w-6" strokeWidth={1.8} />,
    label: 'Keyboard shortcuts',
    action: () => {
      setOpen(false);
      setShortcutsOpen(true);
    }
  }];
  return <div ref={containerRef} className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Settings" aria-expanded={open} className="flex h-10 w-10 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
        <EllipsisVerticalIcon className="h-6 w-6" strokeWidth={1.8} />
      </button>

      <AnimatePresence>
        {open && <motion.div initial={{
        opacity: 0,
        scale: 0.96,
        y: -4
      }} animate={{
        opacity: 1,
        scale: 1,
        y: 0
      }} exit={{
        opacity: 0,
        scale: 0.96,
        y: -4
      }} transition={{
        duration: 0.15,
        ease: [0.23, 1, 0.32, 1]
      }} style={{
        transformOrigin: 'top right'
      }} className="absolute right-0 top-11 z-50 w-[300px] overflow-hidden rounded-xl bg-yt-elevated py-2 shadow-[0_4px_32px_rgba(0,0,0,0.2)] ring-1 ring-black/5 dark:ring-white/10" role="menu">
            {items.map((item) => <button key={item.label} type="button" role="menuitem" onClick={() => {
          item.action?.();
          if (!item.action) setOpen(false);
        }} className="flex h-10 w-full items-center gap-4 px-4 text-left text-[14px] leading-none text-yt-text transition-colors duration-150 hover:bg-yt-hover">
                <span className="shrink-0 text-yt-text">{item.icon}</span>
                {item.label}
              </button>)}
          </motion.div>}
      </AnimatePresence>

      {shortcutsOpen && <KeyboardShortcuts onClose={() => setShortcutsOpen(false)} />}
    </div>;
}