import React, { useEffect, useRef, useState } from 'react';
import { CaptionsIcon, Volume2Icon, VolumeXIcon } from 'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext';
import { loadYouTubeIframeApi, type YouTubePlayer } from '../../utils/youtubeIframe';

interface HoverPreviewProps {
  videoId: string;
  /** Only the hovered card mounts a player — see VideoThumbnail. */
  active: boolean;
}

/** YouTube waits about half a second before committing to a preview. */
const HOVER_DELAY = 550;

/**
 * The inline preview YouTube plays inside a card on hover: muted by default,
 * with its own sound and subtitle toggles stacked in the top-right corner.
 *
 * Sound and captions are switched through the IFrame API rather than by
 * rebuilding the iframe, so toggling them does not restart the preview.
 * Captions are drawn by the player itself, which is why they land in the
 * bottom-left corner with YouTube's own caption styling.
 */
export function HoverPreview({ videoId, active }: HoverPreviewProps) {
  const { watchSeconds } = useLibrary();
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [captions, setCaptions] = useState(false);

  // Resume where the viewer left off, as YouTube's previews do.
  const resumeAt = Math.floor(watchSeconds[videoId] ?? 0);

  useEffect(() => {
    if (!active) {
      setMounted(false);
      return;
    }
    const timer = window.setTimeout(() => setMounted(true), HOVER_DELAY);
    return () => window.clearTimeout(timer);
  }, [active]);

  useEffect(() => {
    if (!mounted || !hostRef.current) return;
    let cancelled = false;

    void loadYouTubeIframeApi().
    then((YT) => {
      if (cancelled || !hostRef.current) return;
      playerRef.current = new YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
          start: resumeAt
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            setReady(true);
            event.target.mute();
            event.target.playVideo();
          }
        }
      });
    }).
    catch(() => undefined);

    return () => {
      cancelled = true;
      setReady(false);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, videoId]);

  // Leaving the card resets both toggles, so the next preview starts silent.
  useEffect(() => {
    if (!active) {
      setMuted(true);
      setCaptions(false);
    }
  }, [active]);

  const stop = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const toggleSound = (event: React.MouseEvent) => {
    stop(event);
    const player = playerRef.current;
    setMuted((current) => {
      if (current) player?.unMute();else
      player?.mute();
      return !current;
    });
  };

  const toggleCaptions = (event: React.MouseEvent) => {
    stop(event);
    const player = playerRef.current;
    setCaptions((current) => {
      try {
        if (current) player?.unloadModule('captions');else
        player?.loadModule('captions');
      } catch {

        // Some videos ship no caption track; the button simply does nothing.
      }return !current;
    });
  };

  if (!mounted) return null;

  return (
    <>
      <div
        className="absolute inset-0 transition-opacity duration-300 ease-out"
        style={{ opacity: ready ? 1 : 0 }}>
        
        <div ref={hostRef} className="h-full w-full" />
      </div>

      {/* Preview controls: sound over subtitles, as on YouTube. */}
      <div className="absolute right-2 top-2 z-10 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? 'Unmute preview' : 'Mute preview'}
          aria-pressed={!muted}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition-colors duration-150 hover:bg-black/80">
          
          {muted ?
          <VolumeXIcon className="h-[22px] w-[22px]" strokeWidth={2} /> :

          <Volume2Icon className="h-[22px] w-[22px]" strokeWidth={2} />
          }
        </button>
        <button
          type="button"
          onClick={toggleCaptions}
          aria-label={captions ? 'Turn off subtitles' : 'Turn on subtitles'}
          aria-pressed={captions}
          className={`flex h-7 w-8 items-center justify-center rounded transition-colors duration-150 ${
          captions ? 'bg-white text-black' : 'bg-black/60 text-white hover:bg-black/80'}`
          }>
          
          <CaptionsIcon className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>
      </div>
    </>);

}