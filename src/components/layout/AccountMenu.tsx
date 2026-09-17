import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRightIcon, CircleDollarSignIcon, ContactRoundIcon, GlobeIcon, KeyboardIcon, LanguagesIcon, LogOutIcon, MessageSquareWarningIcon, MoonIcon, SettingsIcon, ShieldCheckIcon, SlidersHorizontalIcon, SunIcon, UserRoundCogIcon, VideoIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useMyChannel } from '../../hooks/useMyYouTube';
import { ChannelAvatar } from '../video/ChannelAvatar';
import { KeyboardShortcuts } from './KeyboardShortcuts';
const ROW_CLASS = 'flex h-10 w-full items-center gap-4 px-4 text-left text-[14px] leading-none text-yt-text transition-colors duration-150 hover:bg-yt-hover';
function Divider() {
  return <hr className="my-2 border-0 border-t border-yt-border" />;
}
export function AccountMenu() {
  const {
    user,
    signOut
  } = useAuth();
  const {
    theme,
    toggleTheme,
    locale,
    setLocale
  } = useApp();
  const {
    channel
  } = useMyChannel();
  const {
    showToast
  } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [restricted, setRestricted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const language = locale === 'fr' ? 'Français' : 'English';
  const region = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()?.replace(/_/g, ' ') ?? 'Worldwide' : 'Worldwide';
  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };
  // Links that genuinely live on Google's own properties.
  const external = (url: string) => {
    setOpen(false);
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  const unavailable = (label: string) => {
    setOpen(false);
    showToast(`${label} is outside this clone`);
  };
  const toggleRestricted = () => {
    setRestricted((value) => {
      showToast(`Restricted Mode ${value ? 'off' : 'on'}`);
      return !value;
    });
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
  const name = channel?.title ?? user?.user_metadata?.full_name as string | undefined ?? user?.email ?? 'You';
  const avatar = channel?.avatar ?? user?.user_metadata?.avatar_url as string | undefined;
  const handle = channel?.handle ?? user?.email;
  return <div ref={containerRef} className="relative ml-2">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Account menu" aria-expanded={open} className="flex h-8 w-8 items-center justify-center rounded-full">
        <ChannelAvatar name={name} src={avatar} size={32} />
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
      }} className="yt-scroll fixed right-2 top-14 z-50 max-h-[80vh] w-[300px] overflow-y-auto rounded-xl bg-yt-elevated py-2 shadow-[0_4px_32px_rgba(0,0,0,0.2)] ring-1 ring-black/5 sm:absolute sm:right-0 sm:top-11 dark:ring-white/10" role="menu">
            <div className="flex gap-3 px-4 pb-3 pt-1">
              <ChannelAvatar name={name} src={avatar} size={40} />
              <div className="min-w-0">
                <p className="truncate text-[16px] font-medium leading-[22px] text-yt-text">
                  {name}
                </p>
                {handle && <p className="truncate text-[14px] leading-5 text-yt-text">{handle}</p>}
                <Link to="/feed/you" onClick={() => setOpen(false)} className="mt-1 inline-block text-[14px] leading-5 text-yt-blue">
                  View your channel
                </Link>
              </div>
            </div>

            <Divider />

            <button type="button" role="menuitem" onClick={() => external('https://myaccount.google.com')} className={ROW_CLASS}>
              <UserRoundCogIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
              Google Account
            </button>
            <button type="button" role="menuitem" onClick={() => {
          setOpen(false);
          void signOut();
          showToast('Signed out — sign in again to switch account');
        }} className={ROW_CLASS}>
              <ContactRoundIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
              <span className="flex-1">Switch account</span>
              <ChevronRightIcon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
            </button>
            <button type="button" role="menuitem" onClick={() => {
          setOpen(false);
          void signOut();
        }} className={ROW_CLASS}>
              <LogOutIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
              Sign out
            </button>

            <Divider />

            <button type="button" role="menuitem" onClick={() => external('https://studio.youtube.com')} className={ROW_CLASS}>
              <VideoIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
              YouTube Studio
            </button>
            <button type="button" role="menuitem" onClick={() => unavailable('Purchases and memberships')} className={ROW_CLASS}>
              <CircleDollarSignIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
              Purchases and memberships
            </button>

            <Divider />

            <button type="button" role="menuitem" onClick={() => go('/settings')} className={ROW_CLASS}>
              <ShieldCheckIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
              Your data in YouTube
            </button>
            <button type="button" role="menuitem" onClick={toggleTheme} className={ROW_CLASS}>
              {theme === 'dark' ? <MoonIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} /> : <SunIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} />}
              <span className="flex-1">Appearance: {theme === 'dark' ? 'Dark' : 'Light'}</span>
              <ChevronRightIcon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
            </button>
            <button type="button" role="menuitem" onClick={() => {
          const next = locale === 'fr' ? 'en' : 'fr';
          setLocale(next);
          showToast(next === 'fr' ? 'Langue : Français' : 'Language: English');
        }} className={ROW_CLASS}>
              <LanguagesIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
              <span className="flex-1">Language: {language}</span>
              <ChevronRightIcon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
            </button>
            <button type="button" role="menuitem" onClick={toggleRestricted} className={ROW_CLASS}>
              <SlidersHorizontalIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
              <span className="flex-1">Restricted Mode: {restricted ? 'On' : 'Off'}</span>
              <ChevronRightIcon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
            </button>
            <button type="button" role="menuitem" onClick={() => go('/settings')} className={ROW_CLASS}>
              <GlobeIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
              <span className="flex-1">Location: {region}</span>
              <ChevronRightIcon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
            </button>
            <button type="button" role="menuitem" onClick={() => {
          setOpen(false);
          setShortcutsOpen(true);
        }} className={ROW_CLASS}>
              <KeyboardIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
              Keyboard shortcuts
            </button>

            <Divider />

            <button type="button" role="menuitem" onClick={() => go('/settings')} className={ROW_CLASS}>
              <SettingsIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
              Settings
            </button>

            <Divider />

            <button type="button" role="menuitem" onClick={() => external('https://support.google.com/youtube')} className={ROW_CLASS}>
              <div className="h-6 w-6 shrink-0" strokeWidth={1.8} />
              Help
            </button>
            <button type="button" role="menuitem" onClick={() => unavailable('Feedback')} className={ROW_CLASS}>
              <MessageSquareWarningIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
              Send feedback
            </button>
          </motion.div>}
      </AnimatePresence>

      {shortcutsOpen && <KeyboardShortcuts onClose={() => setShortcutsOpen(false)} />}
    </div>;
}