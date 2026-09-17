import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisVerticalIcon,
  PlayIcon,
  XIcon } from
'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import type { Video } from '../../types/youtube';
import { formatDuration } from '../../utils/format';
import { HoverGlow } from '../video/HoverGlow';

interface PlaylistPanelProps {
  title: string;
  subtitle?: string;
  videos: Video[];
  activeId: string;
  listId: string;
  onClose: () => void;
}

export function PlaylistPanel({
  title,
  subtitle,
  videos,
  activeId,
  listId,
  onClose
}: PlaylistPanelProps) {
  const { playList } = usePlayer();
  const [open, setOpen] = useState(true);
  const activeIndex = Math.max(
    0,
    videos.findIndex((video) => video.id === activeId)
  );

  if (videos.length === 0) return null;

  return (
    <section
      className={`mb-4 flex flex-col overflow-hidden rounded-xl border border-yt-border bg-yt-bg ${
      open ? 'h-[calc(100vh-96px)]' : ''}`
      }>
      
      {/* Collapsed, the panel is a single "Up next" bar; expanded, it claims
           the full height of the rail and scrolls its own contents. */}
      <header className="flex shrink-0 items-start gap-2 px-4 pb-2 pt-3">
        <div className="min-w-0 flex-1">
          {open ?
          <>
              <h2 className="truncate text-[16px] font-bold leading-[22px] text-yt-text">
                {title}
              </h2>
              {subtitle &&
            <p className="mt-0.5 truncate text-[12px] leading-[18px] text-yt-sub">{subtitle}</p>
            }
              <p className="mt-0.5 text-[12px] leading-[18px] text-yt-sub">
                {activeIndex + 1} / {videos.length}
              </p>
            </> :

          <>
              <h2 className="truncate text-[15px] font-medium leading-[22px] text-yt-text">
                Up next :: {videos[activeIndex]?.title}
              </h2>
              <p className="mt-0.5 truncate text-[12px] leading-[18px] text-yt-sub">
                {title}
              </p>
            </>
          }
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? 'Collapse playlist' : 'Expand playlist'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
          
          {open ?
          <ChevronUpIcon className="h-6 w-6" strokeWidth={1.8} /> :

          <ChevronDownIcon className="h-6 w-6" strokeWidth={1.8} />
          }
        </button>
        {open &&
        <button
          type="button"
          onClick={onClose}
          aria-label="Close playlist"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
          
            <XIcon className="h-5 w-5" strokeWidth={1.8} />
          </button>
        }
      </header>

      <div className={`no-scrollbar min-h-0 flex-1 overflow-y-auto pb-2 ${open ? '' : 'hidden'}`}>
        {videos.map((video, index) => {
          const active = video.id === activeId;
          return (
            <Link
              key={`${video.id}-${index}`}
              to={`/watch?v=${video.id}&list=${encodeURIComponent(listId)}`}
              onClick={() => playList(videos, index, listId)}
              className={`group relative isolate flex items-center gap-2 py-1 pl-1 pr-2 transition-colors duration-150 ${
              active ? 'bg-yt-chip' : 'hover:bg-yt-hover'}`
              }>
              
              <HoverGlow src={video.thumbnail} variant="row" rounded="rounded-none" />

              <span className="flex w-6 shrink-0 justify-center">
                {active ?
                <PlayIcon className="h-3 w-3 fill-current text-yt-text" strokeWidth={0} /> :

                <span className="text-[12px] leading-[18px] text-yt-sub group-hover:hidden">
                    {index + 1}
                  </span>
                }
              </span>

              <span className="relative h-[56px] w-[100px] shrink-0 overflow-hidden rounded bg-yt-skeleton">
                {video.thumbnail &&
                <img
                  src={video.thumbnail}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover" />

                }
                {formatDuration(video.duration) &&
                <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 text-[11px] leading-4 text-white">
                    {formatDuration(video.duration)}
                  </span>
                }
              </span>

              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 block text-[14px] font-medium leading-5 text-yt-text">
                  {video.title}
                </span>
                <span className="mt-0.5 block truncate text-[12px] leading-[18px] text-yt-sub">
                  {video.channelTitle}
                </span>
              </span>

              <span
                role="presentation"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-yt-text opacity-0 group-hover:opacity-100">
                
                <EllipsisVerticalIcon className="h-5 w-5" strokeWidth={2} />
              </span>
            </Link>);

        })}
      </div>
    </section>);

}