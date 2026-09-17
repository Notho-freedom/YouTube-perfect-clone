import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BellIcon, EllipsisVerticalIcon, SettingsIcon } from 'lucide-react';
import { useSubscriptionFeed } from '../../hooks/useMyYouTube';
import { timeAgo } from '../../utils/format';
import { ChannelAvatar } from '../video/ChannelAvatar';

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { videos, loading } = useSubscriptionFeed();

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

  const items = videos.slice(0, 12);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
        
        <BellIcon className="h-6 w-6" strokeWidth={1.8} />
        {items.length > 0 &&
        <span className="absolute right-0.5 top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-yt-brand px-1 text-[10px] font-medium leading-none text-white">
            {items.length > 9 ? '9+' : items.length}
          </span>
        }
      </button>

      <AnimatePresence>
        {open &&
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -4 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          style={{ transformOrigin: 'top right' }}
          className="fixed right-2 top-14 z-50 w-[calc(100vw-16px)] overflow-hidden rounded-xl bg-yt-elevated shadow-[0_4px_32px_rgba(0,0,0,0.2)] ring-1 ring-black/5 sm:absolute sm:right-0 sm:top-11 sm:w-[480px] dark:ring-white/10"
          role="dialog"
          aria-label="Notifications">
          
            <div className="flex h-12 items-center justify-between px-4">
              <h2 className="text-[16px] font-medium leading-none text-yt-text">Notifications</h2>
              <button
              type="button"
              aria-label="Notification settings"
              className="flex h-9 w-9 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
              
                <SettingsIcon className="h-5 w-5" strokeWidth={1.8} />
              </button>
            </div>
            <hr className="border-0 border-t border-yt-border" />

            <div className="yt-scroll max-h-[70vh] overflow-y-auto py-2">
              {loading &&
            <div className="space-y-4 p-4" aria-busy="true">
                  {Array.from({ length: 4 }).map((_, index) =>
              <div key={index} className="flex animate-pulse items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-yt-skeleton" />
                      <div className="flex-1 space-y-2">
                        <div className="h-[12px] w-4/5 rounded bg-yt-skeleton" />
                        <div className="h-[12px] w-1/3 rounded bg-yt-skeleton" />
                      </div>
                      <div className="h-[54px] w-[96px] shrink-0 rounded bg-yt-skeleton" />
                    </div>
              )}
                </div>
            }

              {!loading && items.length === 0 &&
            <p className="px-4 py-10 text-center text-[14px] leading-5 text-yt-sub">
                  Your notifications live here.
                </p>
            }

              {!loading &&
            items.map((video, index) =>
            <Link
              key={video.id}
              to={`/watch?v=${video.id}`}
              onClick={() => setOpen(false)}
              className="group flex items-start gap-3 px-4 py-3 transition-colors duration-150 hover:bg-yt-hover">
              
                    <span className="mt-6 flex w-2 shrink-0 justify-center">
                      {index < 3 && <span className="h-1.5 w-1.5 rounded-full bg-yt-blue" />}
                    </span>
                    <ChannelAvatar name={video.channelTitle} src={video.channelAvatar} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-[14px] leading-5 text-yt-text">
                        {video.channelTitle} uploaded {video.title}
                      </span>
                      <span className="mt-1 block text-[12px] leading-[18px] text-yt-sub">
                        {timeAgo(video.publishedAt)}
                      </span>
                    </span>
                    <span className="h-[54px] w-[96px] shrink-0 overflow-hidden rounded bg-yt-skeleton">
                      {video.thumbnail &&
                <img
                  src={video.thumbnail}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover" />

                }
                    </span>
                    <span
                role="presentation"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-yt-text opacity-0 group-hover:opacity-100">
                
                      <EllipsisVerticalIcon className="h-5 w-5" strokeWidth={2} />
                    </span>
                  </Link>
            )}
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}