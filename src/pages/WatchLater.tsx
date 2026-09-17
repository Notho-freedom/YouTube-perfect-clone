import React from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, ShuffleIcon, Trash2Icon } from 'lucide-react';
import { CompactVideoCard } from '../components/video/CompactVideoCard';
import { useLibrary } from '../contexts/LibraryContext';

export function WatchLater() {
  const { watchLater, toggleWatchLater } = useLibrary();
  const cover = watchLater[0]?.thumbnail;

  return (
    <div className="px-4 pb-16 pt-6 sm:px-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 overflow-hidden rounded-xl bg-yt-chip p-6 lg:w-[360px]">
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-yt-skeleton">
            {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
          </div>
          <h1 className="mt-4 text-[28px] font-bold leading-9 text-yt-text">Watch later</h1>
          <p className="mt-2 text-[12px] leading-[18px] text-yt-sub">
            {watchLater.length} {watchLater.length === 1 ? 'video' : 'videos'} • Private
          </p>

          <div className="mt-4 flex gap-2">
            {watchLater.length > 0 &&
            <Link
              to={`/watch?v=${watchLater[0].id}`}
              className="flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-yt-inverse px-4 text-[14px] font-medium leading-none text-yt-inverseText transition-opacity duration-150 hover:opacity-90">
              
                <PlayIcon className="h-5 w-5 fill-current" strokeWidth={0} />
                Play all
              </Link>
            }
            <button
              type="button"
              className="flex h-9 items-center justify-center gap-2 rounded-full bg-yt-chipHover px-4 text-[14px] font-medium leading-none text-yt-text">
              
              <ShuffleIcon className="h-5 w-5" strokeWidth={1.8} />
              Shuffle
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {watchLater.length === 0 ?
          <p className="py-16 text-[14px] leading-5 text-yt-sub">
              Nothing saved yet. Hover any thumbnail and hit the clock icon to add a video here.
            </p> :

          <ol className="space-y-2">
              {watchLater.map((video, index) =>
            <li key={video.id} className="flex items-start gap-2">
                  <span className="mt-6 w-6 shrink-0 text-center text-[12px] leading-[18px] text-yt-sub">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <CompactVideoCard video={video} />
                  </div>
                  <button
                type="button"
                onClick={() => toggleWatchLater(video)}
                aria-label={`Remove ${video.title} from Watch later`}
                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
                
                    <Trash2Icon className="h-5 w-5" strokeWidth={1.8} />
                  </button>
                </li>
            )}
            </ol>
          }
        </div>
      </div>
    </div>);

}