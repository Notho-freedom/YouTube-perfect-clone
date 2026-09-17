import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { usePlayer } from '../../contexts/PlayerContext';
import { MusicAmbient } from './MusicAmbient';
import { MusicHeader } from './MusicHeader';
import { MusicSidebar } from './MusicSidebar';

interface MusicShellProps {
  children: React.ReactNode;
}

/**
 * YouTube Music runs as its own app: own masthead, own rail, own surface.
 * It shares this clone's auth, library and player, so switching between
 * YouTube and Music never interrupts playback.
 *
 * At the absolute top of any page the masthead and the rail are fully
 * transparent, letting the page's own backdrop run behind them; the moment the
 * page scrolls they take the surface colour so content never shows through.
 *
 * Music follows the same light/dark preference as YouTube. Its pages are
 * authored dark, so the light theme remaps Music's palette in index.css
 * (`.music-light`) rather than every page carrying two sets of tokens.
 */
export function MusicShell({ children }: MusicShellProps) {
  // Music opens on the narrow rail; the hamburger expands it.
  const [expanded, setExpanded] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const { audioOnly } = usePlayer();
  const { theme } = useApp();
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const light = theme === 'light';

  // Pages whose hero is a photograph: while the page is at the top, the
  // chrome is sitting ON that photograph and must stay white regardless of
  // theme. Ambient-wash pages are excluded — a light wash needs dark text.
  const onMedia = atTop && pathname.startsWith('/music/artist');

  return (
    <div
      data-rail={expanded ? 'wide' : 'narrow'}
      className={`relative min-h-screen bg-[#030303] text-white ${
      light ? 'music-light' : 'dark'} ${
      onMedia ? 'music-on-media' : ''}`}>
      
      <MusicAmbient />

      <MusicHeader onToggleSidebar={() => setExpanded((value) => !value)} transparent={atTop} />
      <MusicSidebar expanded={expanded} transparent={atTop} />

      <main
        className={`relative z-10 pt-16 ${expanded ? 'md:pl-[240px]' : 'md:pl-[72px]'} ${
        audioOnly ? 'pb-[96px]' : 'pb-10'}`
        }>
        
        {children}
      </main>
    </div>);

}