import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CaptionsIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisVerticalIcon,
  ListPlusIcon,
  PauseIcon,
  PlayIcon,
  Repeat1Icon,
  RepeatIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
  SquareIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Volume2Icon,
  VolumeXIcon } from
'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext';
import { usePlayer } from '../../contexts/PlayerContext';
import { useToast } from '../../contexts/ToastContext';
import type { Video } from '../../types/youtube';
import { clockTime, compact } from '../../utils/format';
import { useDominantColor } from '../../hooks/useDominantColor';
import { DropdownMenu } from '../ui/DropdownMenu';

interface MusicPlayerBarProps {
  video: Video;
  playing: boolean;
  position: number;
  duration: number;
  hasNext: boolean;
  unavailable?: boolean;
  onToggle: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
  onClose: () => void;
}

const CONTROL =
'flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors duration-150 hover:bg-white/10 disabled:opacity-40';

/**
 * YouTube Music's persistent bar. It is the only player surface in Music:
 * playback is audio, so nothing above it ever shows the video track.
 */
export function MusicPlayerBar({
  video,
  playing,
  position,
  duration,
  hasNext,
  unavailable = false,
  onToggle,
  onNext,
  onPrevious,
  onSeek,
  onClose
}: MusicPlayerBarProps) {
  const { pathname } = useLocation();
  const { toggleLike, toggleDislike, isLiked, isDisliked, addToQueue } = useLibrary();
  const { showToast } = useToast();
  const {
    repeat,
    cycleRepeat,
    shuffle,
    toggleShuffle,
    volume,
    setVolume,
    muted,
    toggleMuted
  } = usePlayer();
  const [captions, setCaptions] = useState(false);
  const rgb = useDominantColor(video.thumbnail);

  const progress = duration > 0 ? Math.min(100, position / duration * 100) : 0;
  const onPlayerPage = pathname === '/music/player';
  const liked = isLiked(video.id);
  const disliked = isDisliked(video.id);

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] bg-[#030303]">
      {/* The bar picks up a trace of the artwork's colour, like YT Music. */}
      {rgb &&
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: `rgba(${rgb}, 0.09)` }} />

      }

      <div className="relative">
        <div
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(position)}
          tabIndex={0}
          onClick={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const ratio = (event.clientX - bounds.left) / bounds.width;
            onSeek(Math.max(0, Math.min(duration, ratio * duration)));
          }}
          className="group h-[3px] w-full cursor-pointer bg-white/20">
          
          <div
            className="h-full bg-yt-brand transition-[width] duration-200"
            style={{ width: `${progress}%` }} />
          
        </div>

        <div className="flex h-[72px] items-center gap-4 px-3">
          {/* Transport */}
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={onPrevious} aria-label="Previous" className={CONTROL}>
              <SkipBackIcon className="h-5 w-5 fill-current" strokeWidth={0} />
            </button>
            <button
              type="button"
              onClick={onToggle}
              aria-label={playing ? 'Pause' : 'Play'}
              className={CONTROL}>
              
              {playing ?
              <PauseIcon className="h-7 w-7 fill-current" strokeWidth={0} /> :

              <PlayIcon className="h-7 w-7 fill-current" strokeWidth={0} />
              }
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext}
              aria-label="Next"
              className={CONTROL}>
              
              <SkipForwardIcon className="h-5 w-5 fill-current" strokeWidth={0} />
            </button>
            <span className="ml-2 hidden whitespace-nowrap text-[12px] tabular-nums text-white/70 sm:block">
              {clockTime(position)} / {duration > 0 ? clockTime(duration) : '0:00'}
            </span>
          </div>

          {/* Now playing — centred in the bar, as in YouTube Music. */}
          <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
            <Link
              to="/music/player"
              className="flex min-w-0 items-center gap-3"
              aria-label="Open the player">
              
              <span className="h-[34px] w-[60px] shrink-0 overflow-hidden rounded-sm bg-white/10">
                {video.thumbnail &&
                <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
                }
              </span>
              <span className="min-w-0 max-w-[420px]">
                <span className="block truncate text-[14px] font-medium leading-5 text-white">
                  {video.title}
                </span>
                <span className="block truncate text-[12px] leading-4 text-white/60">
                  {unavailable ?
                  'Track unavailable — skipping' :
                  [
                  video.channelTitle,
                  video.views !== undefined && `${compact(video.views)} plays`].

                  filter(Boolean).
                  join(' • ')}
                </span>
              </span>
            </Link>

            <div className="hidden shrink-0 items-center sm:flex">
              <button
                type="button"
                onClick={() => toggleLike(video)}
                aria-label="Like"
                aria-pressed={liked}
                className={`${CONTROL} ${liked ? 'text-white' : 'text-white/70'}`}>
                
                <ThumbsUpIcon
                  className={`h-5 w-5 ${liked ? 'fill-current' : ''}`}
                  strokeWidth={1.8} />
                
              </button>
              <button
                type="button"
                onClick={() => toggleDislike(video)}
                aria-label="Dislike"
                aria-pressed={disliked}
                className={`${CONTROL} ${disliked ? 'text-white' : 'text-white/70'}`}>
                
                <ThumbsDownIcon
                  className={`h-5 w-5 ${disliked ? 'fill-current' : ''}`}
                  strokeWidth={1.8} />
                
              </button>
              <DropdownMenu
                label="More actions"
                align="right"
                width={240}
                icon={<EllipsisVerticalIcon className="h-5 w-5" strokeWidth={1.8} />}
                triggerClassName={CONTROL}
                items={[
                {
                  icon: <ListPlusIcon className="h-5 w-5" strokeWidth={1.8} />,
                  label: 'Add to queue',
                  onSelect: () => {
                    addToQueue(video);
                    showToast('Added to queue');
                  }
                },
                {
                  icon: <SquareIcon className="h-5 w-5" strokeWidth={1.8} />,
                  label: 'Stop playback',
                  separated: true,
                  onSelect: onClose
                }]
                } />
              
            </div>
          </div>

          {/* Playback options */}
          <div className="flex shrink-0 items-center gap-1">
            {/* Volume expands into a slider on hover, as in YouTube Music. */}
            <div className="group/volume hidden items-center md:flex">
              <button
                type="button"
                onClick={toggleMuted}
                aria-label={muted ? 'Unmute' : 'Mute'}
                className={CONTROL}>
                
                {muted || volume === 0 ?
                <VolumeXIcon className="h-5 w-5" strokeWidth={1.8} /> :

                <Volume2Icon className="h-5 w-5" strokeWidth={1.8} />
                }
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setVolume(next);
                  if (next > 0 && muted) toggleMuted();
                }}
                aria-label="Volume"
                className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/30 opacity-0 accent-white transition-all duration-200 ease-out group-hover/volume:w-[72px] group-hover/volume:opacity-100 focus:w-[72px] focus:opacity-100" />
              
            </div>

            <button
              type="button"
              onClick={() => {
                setCaptions((value) => !value);
                showToast(captions ? 'Subtitles off' : 'Subtitles on');
              }}
              aria-pressed={captions}
              aria-label="Captions"
              className={`${CONTROL} hidden lg:flex ${captions ? 'text-white' : 'text-white/70'}`}>
              
              <CaptionsIcon className="h-5 w-5" strokeWidth={1.8} />
            </button>

            <button
              type="button"
              onClick={cycleRepeat}
              aria-label={`Repeat: ${repeat}`}
              className={`${CONTROL} hidden lg:flex ${
              repeat === 'off' ? 'text-white/70' : 'text-white'}`
              }>
              
              {repeat === 'one' ?
              <Repeat1Icon className="h-5 w-5" strokeWidth={1.8} /> :

              <RepeatIcon className="h-5 w-5" strokeWidth={1.8} />
              }
            </button>

            <button
              type="button"
              onClick={toggleShuffle}
              aria-pressed={shuffle}
              aria-label="Shuffle"
              className={`${CONTROL} hidden lg:flex ${shuffle ? 'text-white' : 'text-white/70'}`}>
              
              <ShuffleIcon className="h-5 w-5" strokeWidth={1.8} />
            </button>
            {onPlayerPage ?
            <Link to="/music" aria-label="Collapse player" className={CONTROL}>
                <ChevronDownIcon className="h-5 w-5" strokeWidth={1.8} />
              </Link> :

            <Link to="/music/player" aria-label="Expand player" className={CONTROL}>
                <ChevronUpIcon className="h-5 w-5" strokeWidth={1.8} />
              </Link>
            }
          </div>
        </div>
      </div>
    </div>);

}