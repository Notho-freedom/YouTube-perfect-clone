import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookmarkCheckIcon,
  BookmarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MessageSquareIcon,
  ShareIcon,
  ThumbsDownIcon,
  ThumbsUpIcon } from
'lucide-react';
import { ChannelAvatar } from '../components/video/ChannelAvatar';
import { VideoMenuButton } from '../components/video/VideoMenuButton';
import { useLibrary } from '../contexts/LibraryContext';
import { useToast } from '../contexts/ToastContext';
import { useTasteSignals } from '../hooks/useMyYouTube';
import { useShortsFeed } from '../hooks/useYouTube';
import type { Video } from '../types/youtube';
import { compact } from '../utils/format';

const RAIL_BUTTON =
'flex h-10 w-10 items-center justify-center rounded-full bg-yt-chip text-yt-text transition-colors duration-150 hover:bg-yt-chipHover';

interface ShortSlideProps {
  short: Video;
  active: boolean;
}

function ShortSlide({ short, active }: ShortSlideProps) {
  const {
    toggleWatchLater,
    isInWatchLater,
    toggleLike,
    toggleDislike,
    isLiked,
    isDisliked,
    toggleSubscription,
    isSubscribed
  } = useLibrary();
  const { showToast } = useToast();
  const saved = isInWatchLater(short.id);
  const liked = isLiked(short.id);
  const disliked = isDisliked(short.id);
  const subscribed = isSubscribed(short.channelId);

  const share = async () => {
    const url = `${window.location.origin}/shorts?v=${short.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard');
    } catch {
      showToast('Could not copy the link');
    }
  };

  return (
    <div className="flex h-full snap-start items-center justify-center gap-4 py-2">
      <div className="relative h-full max-h-[calc(100vh-88px)] overflow-hidden rounded-xl bg-black">
        <div className="relative h-full" style={{ aspectRatio: '9 / 16' }}>
          {active ?
          <iframe
            src={`https://www.youtube.com/embed/${short.id}?autoplay=1&loop=1&playlist=${short.id}&rel=0`}
            title={short.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0" /> :


          short.thumbnail &&
          <img src={short.thumbnail} alt="" className="h-full w-full object-cover" />

          }

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
            <div className="pointer-events-auto flex items-center gap-2">
              <ChannelAvatar name={short.channelTitle} src={short.channelAvatar} size={32} />
              <Link
                to={`/channel/${short.channelId}`}
                className="truncate text-[14px] font-medium text-white">
                
                {short.channelTitle}
              </Link>
              <button
                type="button"
                onClick={() =>
                toggleSubscription({
                  channelId: short.channelId,
                  title: short.channelTitle,
                  avatar: short.channelAvatar
                })
                }
                className={`ml-2 flex h-8 shrink-0 items-center rounded-full px-3 text-[14px] font-medium leading-none transition-colors duration-150 ${
                subscribed ?
                'bg-white/20 text-white hover:bg-white/30' :
                'bg-white text-black hover:bg-white/90'}`
                }>
                
                {subscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>
            <p className="mt-3 line-clamp-2 text-[14px] leading-5 text-white">{short.title}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => toggleLike(short)}
            aria-pressed={liked}
            aria-label="Like"
            className={RAIL_BUTTON}>
            
            <ThumbsUpIcon
              className="h-5 w-5"
              strokeWidth={1.8}
              fill={liked ? 'currentColor' : 'none'} />
            
          </button>
          <span className="text-[12px] leading-none text-yt-text">
            {compact((short.likes ?? 0) + (liked ? 1 : 0)) || 'Like'}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => toggleDislike(short)}
            aria-pressed={disliked}
            aria-label="Dislike"
            className={RAIL_BUTTON}>
            
            <ThumbsDownIcon
              className="h-5 w-5"
              strokeWidth={1.8}
              fill={disliked ? 'currentColor' : 'none'} />
            
          </button>
          <span className="text-[12px] leading-none text-yt-text">Dislike</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Link to={`/watch?v=${short.id}`} aria-label="Comments" className={RAIL_BUTTON}>
            <MessageSquareIcon className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <span className="text-[12px] leading-none text-yt-text">
            {compact(short.commentCount ?? 0) || '0'}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button type="button" onClick={() => void share()} aria-label="Share" className={RAIL_BUTTON}>
            <ShareIcon className="h-5 w-5" strokeWidth={1.8} />
          </button>
          <span className="text-[12px] leading-none text-yt-text">Share</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => toggleWatchLater(short)}
            aria-label="Save"
            className={RAIL_BUTTON}>
            
            {saved ?
            <BookmarkCheckIcon className="h-5 w-5" strokeWidth={1.8} /> :

            <BookmarkIcon className="h-5 w-5" strokeWidth={1.8} />
            }
          </button>
          <span className="text-[12px] leading-none text-yt-text">{saved ? 'Saved' : 'Save'}</span>
        </div>

        <VideoMenuButton video={short} align="right" className={RAIL_BUTTON} />
      </div>
    </div>);

}

export function Shorts() {
  const [params] = useSearchParams();
  const signals = useTasteSignals();
  const { shorts, loading } = useShortsFeed(signals);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { recordWatch } = useLibrary();

  const startId = params.get('v');

  useEffect(() => {
    if (!startId || shorts.length === 0) return;
    const index = shorts.findIndex((short) => short.id === startId);
    if (index > 0) {
      setActiveIndex(index);
      const container = containerRef.current;
      if (container) container.scrollTop = index * container.clientHeight;
    }
  }, [startId, shorts]);

  const activeShort = shorts[activeIndex];
  useEffect(() => {
    if (activeShort) recordWatch(activeShort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeShort?.id]);

  const goTo = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container) return;
      const clamped = Math.max(0, Math.min(shorts.length - 1, index));
      container.scrollTo({ top: clamped * container.clientHeight, behavior: 'smooth' });
      setActiveIndex(clamped);
    },
    [shorts.length]
  );

  const onScroll = () => {
    const container = containerRef.current;
    if (!container || container.clientHeight === 0) return;
    const index = Math.round(container.scrollTop / container.clientHeight);
    if (index !== activeIndex) setActiveIndex(index);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        goTo(activeIndex + 1);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        goTo(activeIndex - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, goTo]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <div
          className="h-full max-h-[calc(100vh-88px)] animate-pulse rounded-xl bg-yt-skeleton"
          style={{ aspectRatio: '9 / 16' }} />
        
      </div>);

  }

  if (shorts.length === 0) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center px-6 text-center">
        <p className="text-[14px] leading-5 text-yt-sub">
          No Shorts available right now — the API quota may be exhausted.
        </p>
      </div>);

  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="no-scrollbar h-[calc(100vh-56px)] snap-y snap-mandatory overflow-y-scroll overscroll-contain">
        
        {shorts.map((short, index) =>
        <div key={short.id} className="h-full">
            <ShortSlide short={short} active={index === activeIndex} />
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-label="Previous Short"
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-yt-chip text-yt-text transition-colors duration-150 hover:bg-yt-chipHover disabled:opacity-40">
          
          <ChevronUpIcon className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex === shorts.length - 1}
          aria-label="Next Short"
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-yt-chip text-yt-text transition-colors duration-150 hover:bg-yt-chipHover disabled:opacity-40">
          
          <ChevronDownIcon className="h-6 w-6" strokeWidth={1.8} />
        </button>
      </div>
    </div>);

}