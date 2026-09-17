import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';
import type { Video } from '../../types/youtube';
import { VideoCard } from './VideoCard';
import { VideoCardSkeleton } from './Skeletons';

interface VideoShelfProps {
  title: string;
  videos: Video[];
  loading?: boolean;
  to?: string;
  emptyMessage?: string;
}

export function VideoShelf({ title, videos, loading = false, to, emptyMessage }: VideoShelfProps) {
  const showEmpty = !loading && videos.length === 0;

  return (
    <section className="mt-8 first:mt-0">
      <header className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-[20px] font-bold leading-7 text-yt-text">{title}</h2>
        {to && !showEmpty &&
        <Link
          to={to}
          className="flex h-8 items-center gap-1 rounded-full px-3 text-[14px] font-medium leading-none text-yt-text transition-colors duration-150 hover:bg-yt-hover">
          
            View all
            <ChevronRightIcon className="h-4 w-4" strokeWidth={2} />
          </Link>
        }
      </header>

      {showEmpty ?
      <p className="text-[14px] leading-5 text-yt-sub">
          {emptyMessage ?? 'Nothing here yet.'}
        </p> :

      <div className="no-scrollbar -mx-2 flex gap-2 overflow-x-auto px-2 pb-1">
          {(loading ? Array.from({ length: 5 }) : videos).map((item, index) =>
        <div key={loading ? index : (item as Video).id} className="w-[280px] shrink-0">
              {loading ? <VideoCardSkeleton /> : <VideoCard video={item as Video} />}
            </div>
        )}
        </div>
      }
    </section>);

}