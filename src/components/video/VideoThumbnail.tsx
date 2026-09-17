import React, { useState } from 'react';
import { CheckIcon, ClockIcon, ListVideoIcon } from 'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext';
import type { Video } from '../../types/youtube';
import { durationToSeconds, formatDuration } from '../../utils/format';
import { HoverPreview } from './HoverPreview';
import { Tooltip } from '../ui/Tooltip';

interface VideoThumbnailProps {
  video: Video;
  /** Tailwind rounding utility — 12px on grids, 8px on compact lists. */
  rounded?: string;
  /** YouTube's on-hover "Watch later" / "Add to queue" overlay. */
  hoverActions?: boolean;
  /** Muted inline playback on hover. Off for tiny artwork where it'd be noise. */
  preview?: boolean;
}

export function VideoThumbnail({
  video,
  rounded = 'rounded-xl',
  hoverActions = true,
  preview = true
}: VideoThumbnailProps) {
  const { toggleWatchLater, isInWatchLater, addToQueue, watchSeconds, history } = useLibrary();
  const [hovered, setHovered] = useState(false);
  const duration = formatDuration(video.duration);
  const saved = isInWatchLater(video.id);

  // YouTube's red resume bar. Seconds watched over total length; a video that
  // was opened but never timed still reads as watched, at a nominal amount.
  const total = durationToSeconds(video.duration);
  const watched = watchSeconds[video.id] ?? 0;
  const seen = history.some((entry) => entry.video.id === video.id);
  const progress =
  video.progress ?? (
  total > 0 && watched > 0 ?
  Math.min(1, watched / total) :
  seen ?
  0.06 :
  0);

  const stop = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Live streams have no meaningful preview, and Shorts have their own player.
  const canPreview = preview && !video.isLive;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative aspect-video w-full overflow-hidden bg-yt-skeleton ${rounded}`}>
      
      {video.thumbnail &&
      <img src={video.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
      }

      {canPreview && <HoverPreview videoId={video.id} active={hovered} />}

      {/* Save and queue give way to the preview's own sound and subtitle
           controls once playback starts, exactly as they do on YouTube. */}
      {hoverActions && !(canPreview && hovered) &&
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-2 opacity-0 transition-opacity duration-150 ease-out group-focus-within:opacity-100 group-hover:opacity-100">
          <Tooltip label={saved ? 'Added' : 'Watch later'} side="top">
            <button
            type="button"
            aria-label={saved ? 'Remove from Watch later' : 'Save to Watch later'}
            onClick={(event) => {
              stop(event);
              toggleWatchLater(video);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/80 text-white transition-colors duration-150 hover:bg-black">
            
              {saved ?
            <CheckIcon className="h-5 w-5" strokeWidth={2} /> :

            <ClockIcon className="h-5 w-5" strokeWidth={1.8} />
            }
            </button>
          </Tooltip>
          <Tooltip label="Add to queue" side="top">
            <button
            type="button"
            aria-label="Add to queue"
            onClick={(event) => {
              stop(event);
              addToQueue(video);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/80 text-white transition-colors duration-150 hover:bg-black">
            
              <ListVideoIcon className="h-5 w-5" strokeWidth={1.8} />
            </button>
          </Tooltip>
        </div>
      }

      {video.isLive ?
      <span className="absolute bottom-1 right-1 z-10 flex items-center gap-1 rounded-[4px] bg-yt-brand px-1 py-[1px] text-[12px] font-medium leading-[18px] text-white">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3 fill-current">
            <circle cx="12" cy="12" r="5" />
          </svg>
          LIVE
        </span> :

      duration &&
      <span className="absolute bottom-1 right-1 z-10 rounded-[4px] bg-black/80 px-1 py-[1px] text-[12px] font-medium leading-[18px] text-white">
            {duration}
          </span>

      }

      {progress > 0 &&
      <span className="absolute inset-x-0 bottom-0 z-10 h-[3px] bg-white/30">
          <span
          className="block h-full bg-yt-brand"
          style={{ width: `${Math.max(2, Math.min(100, progress * 100))}%` }} />
        
        </span>
      }
    </div>);

}