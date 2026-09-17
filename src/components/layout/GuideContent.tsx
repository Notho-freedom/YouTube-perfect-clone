import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, CircleUserRoundIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMySubscriptions } from '../../hooks/useMyYouTube';
import {
  exploreExpandedEntries,
  exploreSection,
  footerPrimaryLinks,
  footerSecondaryLinks,
  moreFromYouTube,
  primarySignedIn,
  primarySignedOut,
  reportSection,
  settingsSection,
  youSection } from
'../../data/guide';
import type { GuideEntry } from '../../types/youtube';
import { useT } from '../../hooks/useT';
import { ChannelAvatar } from '../video/ChannelAvatar';
import { GuideIcon } from './GuideIcon';

function Divider() {
  return <hr className="my-3 border-0 border-t border-yt-border" />;
}

function SectionTitle({ label, expandable }: {label: string;expandable?: boolean;}) {
  return (
    <h3 className="flex h-10 items-center gap-1 px-3 text-[16px] font-medium leading-none text-yt-text">
      {label}
      {expandable && <ChevronRightIcon className="h-5 w-5" strokeWidth={1.8} />}
    </h3>);

}

interface RowProps {
  entry: GuideEntry;
  active?: boolean;
  onClick?: () => void;
}

function Row({ entry, active, onClick }: RowProps) {
  const t = useT();
  // The persistent fill behind the current page exists only in the dark
  // theme; in the light theme YouTube marks it with weight alone. Hover keeps
  // its tinted pill in both.
  const className = `flex h-10 w-full items-center gap-6 rounded-[10px] px-3 text-left text-[14px] leading-none text-yt-text transition-colors duration-150 hover:bg-yt-hover ${
  active ? 'font-medium dark:bg-yt-chip' : ''}`;


  if (entry.to) {
    return (
      <Link to={entry.to} className={className} aria-current={active ? 'page' : undefined}>
        <GuideIcon name={entry.icon} />
        <span className="truncate">{t(entry.label)}</span>
      </Link>);

  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <GuideIcon name={entry.icon} />
      <span className="truncate">{t(entry.label)}</span>
    </button>);

}

export function GuideContent() {
  const t = useT();
  const { signedIn, youtubeLinked, signInWithGoogle } = useAuth();
  const { pathname } = useLocation();
  const { subscriptions, loading: subsLoading } = useMySubscriptions();
  const [exploreOpen, setExploreOpen] = useState(false);
  const [subsOpen, setSubsOpen] = useState(false);

  const primary = signedIn ? primarySignedIn : primarySignedOut;
  const visibleSubs = subsOpen ? subscriptions : subscriptions.slice(0, 7);

  return (
    <div className="px-3 pb-6">
      <nav aria-label="Main">
        {primary.entries.map((entry) =>
        <Row key={entry.label} entry={entry} active={entry.to === pathname} />
        )}
      </nav>

      {signedIn ?
      <>
          <Divider />
          <Link
          to="/feed/subscriptions"
          className="flex h-10 items-center gap-1 rounded-[10px] px-3 text-[16px] font-medium leading-none text-yt-text transition-colors duration-150 hover:bg-yt-hover">
          
            {t('Subscriptions')}
            <ChevronRightIcon className="h-5 w-5" strokeWidth={1.8} />
          </Link>

          {subsLoading &&
        Array.from({ length: 6 }).map((_, index) =>
        <div key={index} className="flex h-10 animate-pulse items-center gap-6 px-3">
                <span className="h-6 w-6 shrink-0 rounded-full bg-yt-skeleton" />
                <span className="h-[10px] w-2/3 rounded bg-yt-skeleton" />
              </div>
        )}

          {!subsLoading && !youtubeLinked &&
        <p className="px-3 py-2 text-[12px] leading-[18px] text-yt-sub">
              {t('Grant YouTube access to load your subscriptions.')}
            </p>
        }

          {!subsLoading &&
        visibleSubs.map((channel) =>
        <Link
          key={channel.channelId}
          to={`/results?search_query=${encodeURIComponent(channel.title)}`}
          className="flex h-10 w-full items-center gap-6 rounded-[10px] px-3 text-left text-[14px] leading-none text-yt-text transition-colors duration-150 hover:bg-yt-hover">
          
                <ChannelAvatar name={channel.title} src={channel.avatar} size={24} />
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate">{channel.title}</span>
                  {Boolean(channel.newItemCount) &&
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-yt-blue"
              aria-label={t('New videos')} />

            }
                </span>
              </Link>
        )}

          {!subsLoading && subscriptions.length > 7 &&
        <Row
          entry={{
            label: subsOpen ? 'Show fewer' : 'Show more',
            icon: subsOpen ? 'less' : 'more'
          }}
          onClick={() => setSubsOpen((value) => !value)} />

        }

          <Divider />
          <SectionTitle label={t('You')} expandable />
          {youSection.entries.map((entry) =>
        <Row key={entry.label} entry={entry} active={entry.to === pathname} />
        )}
        </> :

      <>
          <Divider />
          <div className="px-3 pb-2">
            <p className="mb-3 text-[14px] leading-5 text-yt-text">
              {t('Sign in to like videos, comment, and subscribe.')}
            </p>
            <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="flex h-9 items-center gap-1.5 rounded-full border border-yt-searchBorder pl-3 pr-4 text-[14px] font-medium leading-none text-yt-blue transition-colors duration-150 hover:bg-[rgba(6,95,212,0.1)] dark:hover:bg-[rgba(62,166,255,0.2)]">
            
              <CircleUserRoundIcon className="h-6 w-6" strokeWidth={1.8} />
              {t('Sign in')}
            </button>
          </div>
        </>
      }

      <Divider />
      <SectionTitle label={t(exploreSection.title ?? 'Explore')} />
      {exploreSection.entries.
      filter((entry) => entry.icon !== 'more').
      map((entry) =>
      <Row key={entry.label} entry={entry} />
      )}
      {exploreOpen &&
      exploreExpandedEntries.map((entry) => <Row key={entry.label} entry={entry} />)}
      <button
        type="button"
        onClick={() => setExploreOpen((value) => !value)}
        className="flex h-10 w-full items-center gap-6 rounded-[10px] px-3 text-left text-[14px] leading-none text-yt-text transition-colors duration-150 hover:bg-yt-hover">
        
        {exploreOpen ?
        <ChevronUpIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} /> :

        <ChevronDownIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
        }
        {t(exploreOpen ? 'Show fewer' : 'Show more')}
      </button>

      <Divider />
      <SectionTitle label={t(moreFromYouTube.title ?? 'More from YouTube')} />
      {moreFromYouTube.entries.map((entry) =>
      <Row key={entry.label} entry={entry} />
      )}

      <Divider />
      {(signedIn ? settingsSection : reportSection).entries.map((entry) =>
      <Row key={entry.label} entry={entry} />
      )}

      <Divider />
      <div className="px-3 pt-1 text-[13px] font-medium leading-[18px] text-yt-sub">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          {footerPrimaryLinks.map((link) =>
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-150 hover:text-yt-text">
            
              {link.label}
            </a>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-2 gap-y-1">
          {footerSecondaryLinks.map((link) =>
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-150 hover:text-yt-text">
            
              {link.label}
            </a>
          )}
        </div>
        <p className="mt-4 text-[12px] font-normal text-yt-sub">© 2026 Google LLC</p>
      </div>
    </div>);

}