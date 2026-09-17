import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookmarkIcon,
  CompassIcon,
  HomeIcon,
  PlusIcon,
  TargetIcon,
  YoutubeIcon } from
'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext';
import { useToast } from '../../contexts/ToastContext';
import { useT } from '../../hooks/useT';

interface MusicSidebarProps {
  expanded: boolean;
  /** True at the absolute top of the page: the ambient wash shows through. */
  transparent: boolean;
}

const NAV = [
{ label: 'Home', to: '/music', icon: HomeIcon },
{ label: 'Explore', to: '/music/explore', icon: CompassIcon },
{ label: 'Library', to: '/music/library', icon: BookmarkIcon }];


/**
 * YouTube Music's rail. Unlike YouTube, the DEFAULT state is the narrow rail
 * with the label tucked under each icon; the hamburger expands it to the wide
 * drawer that also lists the listener's playlists.
 */
export function MusicSidebar({ expanded, transparent }: MusicSidebarProps) {
  const t = useT();
  const { pathname } = useLocation();
  const { playlists, likes, createPlaylist } = useLibrary();
  const { showToast } = useToast();

  const entries = [...NAV, { label: 'Upgrade', to: '/music/upgrade', icon: TargetIcon }];

  return (
    <nav
      aria-label="YouTube Music"
      className={`music-chrome no-scrollbar fixed bottom-0 left-0 top-16 z-40 hidden flex-col overflow-y-auto overflow-x-hidden pb-24 transition-colors duration-200 ease-out md:flex ${
      transparent ? 'bg-transparent' : 'bg-[#030303]'} ${
      expanded ? 'w-[240px] px-3' : 'w-[72px] items-center px-1'}`}>
      
      <ul className={expanded ? 'mt-2 space-y-1' : 'mt-2 space-y-2'}>
        {entries.map((item) => {
          const active = pathname === item.to || item.to === '/music' && pathname === '/music';
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`flex rounded-lg transition-colors duration-150 ${
                expanded ?
                'h-10 items-center gap-6 px-3' :
                'h-[64px] w-[64px] flex-col items-center justify-center gap-1.5'} ${

                // No permanent fill behind the current entry: Music marks it
                // with full-strength colour and weight, and keeps the tinted
                // pill for hover only.
                active ?
                'font-medium text-white dark:bg-white/[0.12]' :
                'text-white/70 hover:bg-white/[0.06]'}`
                }>
                
                <Icon className="h-6 w-6 shrink-0" strokeWidth={1.7} />
                <span
                  className={
                  expanded ? 'text-[14px] leading-5' : 'text-[10px] leading-none'
                  }>
                  
                  {t(item.label)}
                </span>
              </Link>
            </li>);

        })}
      </ul>

      {expanded &&
      <>
          <button
          type="button"
          onClick={() => {
            const playlist = createPlaylist('New playlist');
            showToast(`Created “${playlist.title}”`);
          }}
          className="mt-4 flex h-9 items-center gap-2 self-start rounded-full bg-white/10 px-4 text-[14px] font-medium leading-none text-white transition-colors duration-150 hover:bg-white/20">
          
            <PlusIcon className="h-5 w-5" strokeWidth={1.8} />
            {t('New playlist')}
          </button>

          <hr className="my-4 border-white/10" />

          <ul className="space-y-3">
            <li>
              <Link to="/music/playlist?list=LL" className="block px-1">
                <span className="block truncate text-[14px] leading-5 text-white">
                  {t('Liked music')}
                </span>
                <span className="block truncate text-[12px] leading-4 text-white/60">
                  {t('Auto playlist')} • {likes.length} {t('songs')}
                </span>
              </Link>
            </li>
            {playlists.map((playlist) =>
          <li key={playlist.id}>
                <Link
              to={`/music/playlist?list=${encodeURIComponent(playlist.id)}`}
              className="block px-1">
              
                  <span className="block truncate text-[14px] leading-5 text-white">
                    {playlist.title}
                  </span>
                  <span className="block truncate text-[12px] leading-4 text-white/60">
                    {t('Playlist')} • {playlist.videos.length} {t('songs')}
                  </span>
                </Link>
              </li>
          )}
          </ul>

          <Link
          to="/"
          className="mt-6 flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] font-medium text-white/70 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white">
          
            <YoutubeIcon className="h-5 w-5" strokeWidth={1.8} />
            YouTube
          </Link>
        </>
      }
    </nav>);

}