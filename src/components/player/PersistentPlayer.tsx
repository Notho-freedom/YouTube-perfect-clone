import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronUpIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SkipForwardIcon,
  XIcon } from
'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext';
import { usePlayer } from '../../contexts/PlayerContext';
import { loadYouTubeIframeApi, type YouTubePlayer } from '../../utils/youtubeIframe';
import { MusicPlayerBar } from './MusicPlayerBar';

const MINI_WIDTH = 400;
const MINI_HEIGHT = 225;

/**
 * One single player instance for the whole app. It is absolutely positioned
 * over the watch page slot, re-docks itself to a floating miniplayer when that
 * slot disappears, and hides its video surface entirely in music mode — so
 * playback never restarts on navigation.
 */
export function PersistentPlayer() {
  const {
    video,
    mode,
    rect,
    next,
    previous,
    hasNext,
    setMode,
    close,
    audioOnly,
    repeat,
    volume,
    muted,
    toggleMuted
  } = usePlayer();
  const { recordWatchTime, watchSeconds } = useLibrary();
  const navigate = useNavigate();

  // Read through a ref: the player is created once and must not be rebuilt
  // every time a watch position is recorded.
  const resumeRef = useRef((id: string) => watchSeconds[id] ?? 0);
  resumeRef.current = (id: string) => {
    const seconds = watchSeconds[id] ?? 0;
    // Treat a nearly-finished video as finished and start it over.
    return seconds > 10 ? seconds : 0;
  };

  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const currentId = useRef<string>('');
  const [apiFailed, setApiFailed] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [ended, setEnded] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoId = video?.id;
  const isMini = !audioOnly && (mode === 'mini' || mode === 'inline' && !rect);

  // Read inside the player's event handlers, which are bound once.
  const repeatRef = useRef(repeat);
  repeatRef.current = repeat;

  useEffect(() => {
    if (!videoId || mode === 'closed') return;
    let cancelled = false;

    loadYouTubeIframeApi().
    then((YT) => {
      if (cancelled || !hostRef.current) return;

      // Resume exactly where this viewer stopped, to the second.
      const resumeAt = Math.floor(resumeRef.current(videoId));

      if (playerRef.current) {
        if (currentId.current !== videoId) {
          currentId.current = videoId;
          setEnded(false);
          setUnavailable(false);
          setPosition(resumeAt);
          playerRef.current.loadVideoById(videoId);
          if (resumeAt > 0) playerRef.current.seekTo(resumeAt, true);
        }
        return;
      }

      currentId.current = videoId;
      playerRef.current = new YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          playsinline: 1,
          origin: window.location.origin,
          start: resumeAt
        },
        events: {
          onReady: (event) => {
            setDuration(event.target.getDuration());
            if (resumeAt > 0) event.target.seekTo(resumeAt, true);
          },
          onError: () => {
            // Not embeddable / removed: skip to the next track rather than
            // leaving "Video unavailable" sitting on screen.
            setUnavailable(true);
            const upcoming = next();
            if (upcoming) setUnavailable(false);
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              setPlaying(true);
              setEnded(false);
              setDuration(event.target.getDuration());
            }
            if (event.data === YT.PlayerState.PAUSED) setPlaying(false);
            if (event.data === YT.PlayerState.ENDED) {
              // Repeat-one returns the same track, so `videoId` never
              // changes and the load effect would not fire — restart here.
              if (repeatRef.current === 'one') {
                event.target.seekTo(0, true);
                event.target.playVideo();
                return;
              }
              // Advance ourselves so YouTube's external end screen never shows.
              const upcoming = next();
              if (!upcoming) setEnded(true);
            }
          }
        }
      });
    }).
    catch(() => setApiFailed(true));

    return () => {
      cancelled = true;
    };
  }, [videoId, mode, next]);

  // Track progress while playing: it drives the music bar and, more
  // importantly, feeds "minutes actually watched" into the recommendations.
  useEffect(() => {
    if (!playing || !videoId) return;
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const current = player.getCurrentTime();
      setPosition(current);
      const total = player.getDuration();
      if (total > 0) setDuration(total);
      recordWatchTime(videoId, Math.round(current));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing, videoId, recordWatchTime]);

  // YouTube's global playback shortcuts. They live here because this is the
  // only component holding the player handle, so they work from any page.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const player = playerRef.current;
      if (!player) return;

      if (event.key === 'k' || event.key === ' ') {
        event.preventDefault();
        if (player.getPlayerState() === 1) player.pauseVideo();else
        player.playVideo();
      } else if (event.key === 'm') {
        toggleMuted();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleMuted]);

  // Mirror the Music bar's volume and mute onto the IFrame player.
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.setVolume?.(muted ? 0 : volume);
    if (muted) player.mute?.();else
    player.unMute?.();
  }, [volume, muted, videoId]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
      currentId.current = '';
    };
  }, []);

  if (!video || mode === 'closed') return null;

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (playing) player.pauseVideo();else
    player.playVideo();
  };

  const replay = () => {
    setEnded(false);
    playerRef.current?.seekTo(0, true);
    playerRef.current?.playVideo();
  };

  // In music mode the video only appears on the YouTube Music player page,
  // which registers a slot. Everywhere else the surface is parked off-screen
  // and only the audio bar is visible — the sound never stops.
  const surfaceStyle: React.CSSProperties = audioOnly ?
  rect ?
  {
    position: 'fixed',
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    zIndex: 20
  } :
  {
    // Parked off-screen at full size rather than hidden: browsers
    // throttle players they consider invisible, and Music must keep
    // playing while the listener browses.
    position: 'fixed',
    bottom: 0,
    left: -10000,
    width: 480,
    height: 270,
    pointerEvents: 'none'
  } :
  isMini ?
  {
    position: 'fixed',
    right: 16,
    bottom: 16,
    width: MINI_WIDTH,
    height: MINI_HEIGHT,
    zIndex: 55
  } :
  {
    position: 'fixed',
    top: rect?.top ?? 0,
    left: rect?.left ?? 0,
    width: rect?.width ?? 0,
    height: rect?.height ?? 0,
    zIndex: 20
  };

  return (
    <>
      <div
        style={surfaceStyle}
        className={`group overflow-hidden bg-black ${
        isMini ? 'rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.45)]' : 'rounded-xl'}`
        }>
        
        <div ref={hostRef} className="h-full w-full" />

        {apiFailed &&
        <iframe
          src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0" />

        }

        {ended && (!audioOnly || rect) &&
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/85">
            <p className="px-6 text-center text-[16px] font-medium text-white">{video.title}</p>
            <div className="flex gap-3">
              <button
              type="button"
              onClick={replay}
              className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-medium text-black">
              
                <RotateCcwIcon className="h-5 w-5" strokeWidth={1.8} />
                Replay
              </button>
              {hasNext &&
            <button
              type="button"
              onClick={() => next()}
              className="flex h-10 items-center gap-2 rounded-full bg-white/15 px-4 text-[14px] font-medium text-white">
              
                  <SkipForwardIcon className="h-5 w-5" strokeWidth={1.8} />
                  Next
                </button>
            }
            </div>
          </div>
        }

        {isMini &&
        <>
            <div className="absolute inset-x-0 top-0 flex items-center justify-end gap-1 bg-gradient-to-b from-black/70 to-transparent p-2 opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100">
              <button
              type="button"
              onClick={() => {
                setMode('inline');
                navigate(`/watch?v=${video.id}`);
              }}
              aria-label="Expand"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors duration-150 hover:bg-white/20">
              
                <ChevronUpIcon className="h-5 w-5" strokeWidth={1.8} />
              </button>
              <button
              type="button"
              onClick={close}
              aria-label="Close player"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors duration-150 hover:bg-white/20">
              
                <XIcon className="h-5 w-5" strokeWidth={1.8} />
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-2 py-2 opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100">
              <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? 'Pause' : 'Play'}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors duration-150 hover:bg-white/20">
              
                {playing ?
              <PauseIcon className="h-5 w-5 fill-current" strokeWidth={0} /> :

              <PlayIcon className="h-5 w-5 fill-current" strokeWidth={0} />
              }
              </button>
              <button
              type="button"
              onClick={() => next()}
              disabled={!hasNext}
              aria-label="Next"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors duration-150 hover:bg-white/20 disabled:opacity-40">
              
                <SkipForwardIcon className="h-5 w-5 fill-current" strokeWidth={0} />
              </button>
              <p className="line-clamp-1 flex-1 text-[12px] leading-4 text-white">{video.title}</p>
            </div>
          </>
        }
      </div>

      {audioOnly &&
      <MusicPlayerBar
        video={video}
        unavailable={unavailable}
        playing={playing}
        position={position}
        duration={duration}
        hasNext={hasNext}
        onToggle={togglePlay}
        onNext={() => next()}
        onPrevious={() => previous()}
        onSeek={(seconds) => {
          playerRef.current?.seekTo(seconds, true);
          setPosition(seconds);
        }}
        onClose={close} />

      }
    </>);

}