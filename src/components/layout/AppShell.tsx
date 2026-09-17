import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp, useGuideToggle } from '../../contexts/AppContext';
import { usePlayer } from '../../contexts/PlayerContext';
import { AuthToast } from './AuthToast';
import { GuideDrawer } from './GuideDrawer';
import { Header } from './Header';
import { MiniGuide } from './MiniGuide';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  /** 'full' keeps a persistent guide (home, search); 'overlay' uses the drawer (watch). */
  guideMode: 'full' | 'overlay';
  children: React.ReactNode;
}

export function AppShell({ guideMode, children }: AppShellProps) {
  const { guideExpanded, closeDrawer } = useApp();
  const { audioOnly } = usePlayer();
  const isOverlay = guideMode === 'overlay';
  const toggleGuide = useGuideToggle(isOverlay);
  const showFullGuide = !isOverlay && guideExpanded;
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    closeDrawer();
  }, [pathname, search, closeDrawer]);

  const mainPadding = isOverlay ?
  '' :
  showFullGuide ?
  'sm:pl-[72px] lg:pl-[240px]' :
  'sm:pl-[72px]';

  return (
    <div className="min-h-full w-full bg-yt-bg font-sans text-yt-text">
      <Header onToggleGuide={toggleGuide} />
      {!isOverlay &&
      <>
          {showFullGuide && <Sidebar />}
          <MiniGuide className={showFullGuide ? 'lg:hidden' : undefined} />
        </>
      }
      <GuideDrawer />
      <main className={`pt-14 ${mainPadding} ${audioOnly ? 'pb-[72px]' : ''}`}>{children}</main>
      <AuthToast />
    </div>);

}