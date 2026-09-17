import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { miniGuideEntries } from '../../data/guide';
import { useT } from '../../hooks/useT';
import { GuideIcon } from './GuideIcon';

interface MiniGuideProps {
  className?: string;
}

export function MiniGuide({ className = '' }: MiniGuideProps) {
  const t = useT();
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Main mini"
      className={`fixed left-0 top-14 z-30 hidden h-[calc(100%-56px)] w-[72px] flex-col items-center overflow-y-auto bg-yt-bg pt-1 sm:flex ${className}`}>
      
      {miniGuideEntries.map((entry) => {
        const active = entry.to === pathname;
        return (
          <Link
            key={entry.label}
            to={entry.to ?? '/'}
            aria-current={active ? 'page' : undefined}
            className={`flex h-[74px] w-16 flex-col items-center justify-center gap-1 rounded-[10px] px-1 text-yt-text transition-colors duration-150 hover:bg-yt-hover ${
            active ? 'font-medium dark:bg-yt-chip' : ''}`
            }>
            
            <GuideIcon name={entry.icon} />
            <span className="w-full truncate text-center text-[10px] leading-[14px]">
              {t(entry.label)}
            </span>
          </Link>);

      })}
    </nav>);

}