import React from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon } from 'lucide-react';
import type { Video } from '../../types/youtube';
import { compact, formatDuration } from '../../utils/format';
import { HoverGlow } from '../video/HoverGlow';
import { VideoMenuButton } from '../video/VideoMenuButton';

interface MusicTrackRowProps {
  track: Video;
  onPlay: () => void;
  /** Shows the index instead of the artwork, like an album track list. */
  index?: number;
}

export function MusicTrackRow({ track, onPlay, index }: MusicTrackRowProps) {
  return (
    <div className="group relative isolate flex items-center gap-3 rounded-lg p-2 transition-colors duration-150 hover:bg-white/10">
      <HoverGlow src={track.thumbnail} variant="row" rounded="rounded-lg" />

      {index !== undefined &&
      <span className="w-5 shrink-0 text-center text-[12px] tabular-nums text-white/50">
          {index + 1}
        </span>
      }

      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play ${track.title}`}
        className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-white/10">
        
        {track.thumbnail &&
        <img src={track.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
        }
        <span className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100">
          <PlayIcon className="h-5 w-5 fill-white text-white" strokeWidth={0} />
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <button type="button" onClick={onPlay} className="block w-full text-left">
          <span className="block truncate text-[14px] font-medium leading-5 text-white">
            {track.title}
          </span>
        </button>
        <p className="truncate text-[12px] leading-4 text-white/60">
          <Link
            to={`/music/artist/${track.channelId}`}
            className="transition-colors duration-150 hover:text-white">
            
            {track.channelTitle}
          </Link>
          {track.views !== undefined && ` • ${compact(track.views)} plays`}
        </p>
      </div>

      <span className="shrink-0 text-[12px] tabular-nums text-white/50">
        {formatDuration(track.duration)}
      </span>

      <VideoMenuButton video={track} className="shrink-0" />
    </div>);

}