import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setAppLocale, type AppLocale } from '../utils/format';

export type Theme = 'dark' | 'light';

const LOCALE_KEY = 'yt-clone:locale';

interface AppContextValue {
  theme: Theme;
  toggleTheme: () => void;
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  guideExpanded: boolean;
  toggleGuide: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

interface AppProviderProps {
  initialTheme: Theme;
  children: React.ReactNode;
}

export function AppProvider({ initialTheme, children }: AppProviderProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [guideExpanded, setGuideExpanded] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Stored choice wins over the browser's language, so switching back from
  // French to English sticks — reading navigator.language alone made the
  // change one-way on a French system.
  const [locale, setLocaleState] = useState<AppLocale>(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCALE_KEY) : null;
    if (stored === 'en' || stored === 'fr') return stored;
    return typeof navigator !== 'undefined' && navigator.language.startsWith('fr') ? 'fr' : 'en';
  });

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_KEY, next);
    } catch {

      // Private mode: the choice simply does not survive a reload.
    }}, []);

  useEffect(() => {
    setAppLocale(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    setTheme(initialTheme);
  }, [initialTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((current) => current === 'dark' ? 'light' : 'dark'),
    []
  );
  const toggleGuide = useCallback(() => setGuideExpanded((current) => !current), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo<AppContextValue>(
    () => ({
      theme,
      toggleTheme,
      locale,
      setLocale,
      guideExpanded,
      toggleGuide,
      drawerOpen,
      openDrawer,
      closeDrawer
    }),
    [
    theme,
    toggleTheme,
    locale,
    setLocale,
    guideExpanded,
    toggleGuide,
    drawerOpen,
    openDrawer,
    closeDrawer]

  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside an AppProvider');
  return context;
}

/** Convenience hook for the masthead hamburger, which behaves differently per page. */
export function useGuideToggle(isOverlay: boolean) {
  const { toggleGuide, openDrawer } = useApp();
  return useCallback(() => {
    if (isOverlay) openDrawer();else
    toggleGuide();
  }, [isOverlay, openDrawer, toggleGuide]);
}