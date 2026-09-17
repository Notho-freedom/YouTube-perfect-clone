import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { Video } from '../types/youtube';

export type PlayerMode = 'inline' | 'mini' | 'closed';

/** Off → repeat the whole queue → repeat this track, as in YouTube Music. */
export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface PlayerContextValue {
  video: Video | undefined;
  queue: Video[];
  queueIndex: number;
  listId: string | null;
  mode: PlayerMode;
  /** Music mode: the video surface is hidden and only the audio bar shows. */
  audioOnly: boolean;
  setAudioOnly: (audioOnly: boolean) => void;
  playTrack: (videos: Video[], index: number) => void;
  /** Rect of the inline slot on the watch page, in viewport coordinates. */
  rect: PlayerRect | null;
  /** Registers the current inline slot so the persistent player can cover it. */
  setRect: (rect: PlayerRect | null) => void;
  play: (video: Video) => void;
  playList: (videos: Video[], index: number, listId?: string | null) => void;
  setMode: (mode: PlayerMode) => void;
  next: () => Video | undefined;
  previous: () => Video | undefined;
  close: () => void;
  hasNext: boolean;
  /** Jump straight to a position in the current queue. */
  jumpTo: (index: number) => void;
  repeat: RepeatMode;
  cycleRepeat: () => void;
  shuffle: boolean;
  toggleShuffle: () => void;
  /** 0–100, mirrored onto the IFrame player. */
  volume: number;
  setVolume: (volume: number) => void;
  muted: boolean;
  toggleMuted: () => void;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export function PlayerProvider({ children }: {children: React.ReactNode;}) {
  const [queue, setQueue] = useState<Video[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [listId, setListId] = useState<string | null>(null);
  const [mode, setMode] = useState<PlayerMode>('closed');
  const [audioOnly, setAudioOnly] = useState(false);
  const [rect, setRectState] = useState<PlayerRect | null>(null);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [shuffle, setShuffle] = useState(false);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const lastRect = useRef<string>('');

  const setRect = useCallback((next: PlayerRect | null) => {
    const signature = next ? `${next.top}|${next.left}|${next.width}|${next.height}` : 'null';
    if (signature === lastRect.current) return;
    lastRect.current = signature;
    setRectState(next);
  }, []);

  const playTrack = useCallback((videos: Video[], index: number) => {
    setQueue(videos);
    setQueueIndex(Math.max(0, Math.min(videos.length - 1, index)));
    setListId(null);
    setAudioOnly(true);
    setMode('inline');
  }, []);

  const play = useCallback((video: Video) => {
    setAudioOnly(false);
    setQueue((current) => {
      const existing = current.findIndex((item) => item.id === video.id);
      if (existing >= 0) {
        setQueueIndex(existing);
        return current;
      }
      setQueueIndex(0);
      return [video];
    });
    setListId(null);
    setMode('inline');
  }, []);

  const playList = useCallback((videos: Video[], index: number, list: string | null = null) => {
    setAudioOnly(false);
    setQueue(videos);
    setQueueIndex(Math.max(0, Math.min(videos.length - 1, index)));
    setListId(list);
    setMode('inline');
  }, []);

  const jumpTo = useCallback((index: number) => {
    setQueueIndex((current) => index >= 0 ? index : current);
  }, []);

  const next = useCallback((): Video | undefined => {
    let target: Video | undefined;
    setQueueIndex((current) => {
      if (queue.length === 0) return current;
      // Repeat-one keeps the same track; the player reloads it itself.
      if (repeat === 'one') {
        target = queue[current];
        return current;
      }
      if (shuffle && queue.length > 1) {
        let candidate = current;
        while (candidate === current) candidate = Math.floor(Math.random() * queue.length);
        target = queue[candidate];
        return candidate;
      }
      const candidate = current + 1;
      if (candidate >= queue.length) {
        if (repeat !== 'all') return current;
        target = queue[0];
        return 0;
      }
      target = queue[candidate];
      return candidate;
    });
    return target;
  }, [queue, repeat, shuffle]);

  const previous = useCallback((): Video | undefined => {
    let target: Video | undefined;
    setQueueIndex((current) => {
      const candidate = current - 1;
      if (candidate < 0) {
        if (repeat !== 'all' || queue.length === 0) return current;
        target = queue[queue.length - 1];
        return queue.length - 1;
      }
      target = queue[candidate];
      return candidate;
    });
    return target;
  }, [queue, repeat]);

  const close = useCallback(() => {
    setMode('closed');
    setQueue([]);
    setQueueIndex(0);
    setListId(null);
    setAudioOnly(false);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeat((current) => current === 'off' ? 'all' : current === 'all' ? 'one' : 'off');
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((value) => !value), []);
  const toggleMuted = useCallback(() => setMuted((value) => !value), []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      video: queue[queueIndex],
      queue,
      queueIndex,
      listId,
      mode,
      audioOnly,
      setAudioOnly,
      playTrack,
      rect,
      setRect,
      play,
      playList,
      setMode,
      next,
      previous,
      close,
      // Repeat and shuffle mean the queue never truly runs out.
      hasNext: queueIndex + 1 < queue.length || queue.length > 0 && repeat !== 'off' || shuffle,
      jumpTo,
      repeat,
      cycleRepeat,
      shuffle,
      toggleShuffle,
      volume,
      setVolume,
      muted,
      toggleMuted
    }),
    [
    queue,
    queueIndex,
    listId,
    mode,
    audioOnly,
    playTrack,
    rect,
    setRect,
    play,
    playList,
    next,
    previous,
    close,
    jumpTo,
    repeat,
    cycleRepeat,
    shuffle,
    toggleShuffle,
    volume,
    muted,
    toggleMuted]

  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used inside a PlayerProvider');
  return context;
}