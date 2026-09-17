/** Minimal typings + loader for YouTube's IFrame Player API. */

export interface YouTubePlayer {
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  /** 'captions' on HTML5; toggles the caption track without a reload. */
  loadModule: (module: string) => void;
  unloadModule: (module: string) => void;
  setOption: (module: string, option: string, value: unknown) => void;
  destroy: () => void;
}

interface YouTubePlayerEvent {
  data: number;
  target: YouTubePlayer;
}

export interface YouTubePlayerOptions {
  videoId: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: YouTubePlayerEvent) => void;
    onStateChange?: (event: YouTubePlayerEvent) => void;
    /** 2 invalid id, 5 HTML5 error, 100 removed, 101/150 embedding disabled. */
    onError?: (event: YouTubePlayerEvent) => void;
  };
}

interface YouTubeNamespace {
  Player: new (element: HTMLElement | string, options: YouTubePlayerOptions) => YouTubePlayer;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let loader: Promise<YouTubeNamespace> | null = null;

export function loadYouTubeIframeApi(): Promise<YouTubeNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (loader) return loader;

  loader = new Promise<YouTubeNamespace>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('IFrame API timeout')), 10_000);

    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timer);
      if (window.YT) resolve(window.YT);else
      reject(new Error('IFrame API unavailable'));
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error('IFrame API failed to load'));
    };
    document.head.appendChild(script);
  });

  return loader;
}