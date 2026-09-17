import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { HistoryEntry, LocalPlaylist, SubscriptionItem, Video } from '../types/youtube';

/**
 * The clone's native library.
 *
 * Two reasons it exists. First, the YouTube Data API never exposed watch
 * history, "Watch later" or the queue. Second, the `youtube.readonly` scope is
 * read-only and needs Google verification to leave testing — so likes,
 * subscriptions and playlists a viewer performs here are stored natively and
 * merged on top of whatever the API returns. A Google-only sign-in therefore
 * gets a complete experience with no YouTube scope at all.
 */
interface LibraryState {
  history: HistoryEntry[];
  watchLater: Video[];
  queue: Video[];
  searchHistory: string[];
  /** Native likes/dislikes, keyed by video. */
  likes: Video[];
  dislikes: string[];
  /** Channels followed inside the clone. */
  subscriptions: SubscriptionItem[];
  playlists: LocalPlaylist[];
  /** Channels the viewer asked not to be recommended. */
  mutedChannels: string[];
  /** Per-video seconds watched, used to weight the recommendation signals. */
  watchSeconds: Record<string, number>;
}

interface LibraryContextValue extends LibraryState {
  recordWatch: (video: Video) => void;
  recordWatchTime: (videoId: string, seconds: number) => void;
  clearHistory: () => void;
  removeFromHistory: (videoId: string) => void;
  toggleWatchLater: (video: Video) => void;
  clearWatchLater: () => void;
  clearSearchHistory: () => void;
  isInWatchLater: (videoId: string) => boolean;
  addToQueue: (video: Video) => void;
  clearQueue: () => void;
  recordSearch: (query: string) => void;
  removeSearch: (query: string) => void;

  toggleLike: (video: Video) => void;
  toggleDislike: (video: Video) => void;
  isLiked: (videoId: string) => boolean;
  isDisliked: (videoId: string) => boolean;

  toggleSubscription: (channel: SubscriptionItem) => void;
  isSubscribed: (channelId: string) => boolean;

  createPlaylist: (title: string, video?: Video) => LocalPlaylist;
  deletePlaylist: (playlistId: string) => void;
  togglePlaylistVideo: (playlistId: string, video: Video) => void;
  isInPlaylist: (playlistId: string, videoId: string) => boolean;

  muteChannel: (channelId: string) => void;
  isMuted: (channelId: string) => boolean;
}

const STORAGE_KEY = 'ytclone.library';
const MAX_HISTORY = 200;
const MAX_SEARCHES = 20;

const EMPTY: LibraryState = {
  history: [],
  watchLater: [],
  queue: [],
  searchHistory: [],
  likes: [],
  dislikes: [],
  subscriptions: [],
  playlists: [],
  mutedChannels: [],
  watchSeconds: {}
};

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

function readState(): LibraryState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<LibraryState>;
    return {
      history: parsed.history ?? [],
      watchLater: parsed.watchLater ?? [],
      queue: parsed.queue ?? [],
      searchHistory: parsed.searchHistory ?? [],
      likes: parsed.likes ?? [],
      dislikes: parsed.dislikes ?? [],
      subscriptions: parsed.subscriptions ?? [],
      playlists: parsed.playlists ?? [],
      mutedChannels: parsed.mutedChannels ?? [],
      watchSeconds: parsed.watchSeconds ?? {}
    };
  } catch {
    return EMPTY;
  }
}

export function LibraryProvider({ children }: {children: React.ReactNode;}) {
  const [state, setState] = useState<LibraryState>(() => readState());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {

      /* storage unavailable */}
  }, [state]);

  const recordWatch = useCallback((video: Video) => {
    if (!video.id) return;
    setState((current) => ({
      ...current,
      history: [
      { video, watchedAt: Date.now() },
      ...current.history.filter((entry) => entry.video.id !== video.id)].
      slice(0, MAX_HISTORY)
    }));
  }, []);

  const recordWatchTime = useCallback((videoId: string, seconds: number) => {
    if (!videoId || seconds <= 0) return;
    setState((current) => {
      const previous = current.watchSeconds[videoId] ?? 0;
      if (seconds <= previous) return current;
      return { ...current, watchSeconds: { ...current.watchSeconds, [videoId]: seconds } };
    });
  }, []);

  const clearHistory = useCallback(
    () => setState((current) => ({ ...current, history: [], watchSeconds: {} })),
    []
  );

  const removeFromHistory = useCallback((videoId: string) => {
    setState((current) => ({
      ...current,
      history: current.history.filter((entry) => entry.video.id !== videoId)
    }));
  }, []);

  const toggleWatchLater = useCallback((video: Video) => {
    setState((current) => {
      const exists = current.watchLater.some((item) => item.id === video.id);
      return {
        ...current,
        watchLater: exists ?
        current.watchLater.filter((item) => item.id !== video.id) :
        [video, ...current.watchLater]
      };
    });
  }, []);

  const clearWatchLater = useCallback(
    () => setState((current) => ({ ...current, watchLater: [] })),
    []
  );

  const clearSearchHistory = useCallback(
    () => setState((current) => ({ ...current, searchHistory: [] })),
    []
  );

  const addToQueue = useCallback((video: Video) => {
    setState((current) =>
    current.queue.some((item) => item.id === video.id) ?
    current :
    { ...current, queue: [...current.queue, video] }
    );
  }, []);

  const clearQueue = useCallback(() => setState((current) => ({ ...current, queue: [] })), []);

  const recordSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setState((current) => ({
      ...current,
      searchHistory: [
      trimmed,
      ...current.searchHistory.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].
      slice(0, MAX_SEARCHES)
    }));
  }, []);

  const removeSearch = useCallback((query: string) => {
    setState((current) => ({
      ...current,
      searchHistory: current.searchHistory.filter((item) => item !== query)
    }));
  }, []);

  const toggleLike = useCallback((video: Video) => {
    setState((current) => {
      const exists = current.likes.some((item) => item.id === video.id);
      return {
        ...current,
        likes: exists ?
        current.likes.filter((item) => item.id !== video.id) :
        [video, ...current.likes],
        dislikes: current.dislikes.filter((id) => id !== video.id)
      };
    });
  }, []);

  const toggleDislike = useCallback((video: Video) => {
    setState((current) => {
      const exists = current.dislikes.includes(video.id);
      return {
        ...current,
        dislikes: exists ?
        current.dislikes.filter((id) => id !== video.id) :
        [video.id, ...current.dislikes],
        likes: current.likes.filter((item) => item.id !== video.id)
      };
    });
  }, []);

  const toggleSubscription = useCallback((channel: SubscriptionItem) => {
    if (!channel.channelId) return;
    setState((current) => {
      const exists = current.subscriptions.some((item) => item.channelId === channel.channelId);
      return {
        ...current,
        subscriptions: exists ?
        current.subscriptions.filter((item) => item.channelId !== channel.channelId) :
        [channel, ...current.subscriptions]
      };
    });
  }, []);

  const createPlaylist = useCallback((title: string, video?: Video): LocalPlaylist => {
    const playlist: LocalPlaylist = {
      id: `local:${Date.now().toString(36)}`,
      title: title.trim() || 'New playlist',
      description: '',
      videos: video ? [video] : [],
      createdAt: Date.now(),
      privacyStatus: 'private'
    };
    setState((current) => ({ ...current, playlists: [playlist, ...current.playlists] }));
    return playlist;
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    setState((current) => ({
      ...current,
      playlists: current.playlists.filter((item) => item.id !== playlistId)
    }));
  }, []);

  const togglePlaylistVideo = useCallback((playlistId: string, video: Video) => {
    setState((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) => {
        if (playlist.id !== playlistId) return playlist;
        const exists = playlist.videos.some((item) => item.id === video.id);
        return {
          ...playlist,
          videos: exists ?
          playlist.videos.filter((item) => item.id !== video.id) :
          [...playlist.videos, video]
        };
      })
    }));
  }, []);

  const muteChannel = useCallback((channelId: string) => {
    if (!channelId) return;
    setState((current) =>
    current.mutedChannels.includes(channelId) ?
    current :
    { ...current, mutedChannels: [channelId, ...current.mutedChannels] }
    );
  }, []);

  const isInWatchLater = useCallback(
    (videoId: string) => state.watchLater.some((item) => item.id === videoId),
    [state.watchLater]
  );

  const isLiked = useCallback(
    (videoId: string) => state.likes.some((item) => item.id === videoId),
    [state.likes]
  );

  const isDisliked = useCallback(
    (videoId: string) => state.dislikes.includes(videoId),
    [state.dislikes]
  );

  const isSubscribed = useCallback(
    (channelId: string) => state.subscriptions.some((item) => item.channelId === channelId),
    [state.subscriptions]
  );

  const isInPlaylist = useCallback(
    (playlistId: string, videoId: string) =>
    state.playlists.
    find((playlist) => playlist.id === playlistId)?.
    videos.some((item) => item.id === videoId) ?? false,
    [state.playlists]
  );

  const isMuted = useCallback(
    (channelId: string) => state.mutedChannels.includes(channelId),
    [state.mutedChannels]
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      ...state,
      recordWatch,
      recordWatchTime,
      clearHistory,
      removeFromHistory,
      toggleWatchLater,
      clearWatchLater,
      clearSearchHistory,
      isInWatchLater,
      addToQueue,
      clearQueue,
      recordSearch,
      removeSearch,
      toggleLike,
      toggleDislike,
      isLiked,
      isDisliked,
      toggleSubscription,
      isSubscribed,
      createPlaylist,
      deletePlaylist,
      togglePlaylistVideo,
      isInPlaylist,
      muteChannel,
      isMuted
    }),
    [
    state,
    recordWatch,
    recordWatchTime,
    clearHistory,
    removeFromHistory,
    toggleWatchLater,
    clearWatchLater,
    clearSearchHistory,
    isInWatchLater,
    addToQueue,
    clearQueue,
    recordSearch,
    removeSearch,
    toggleLike,
    toggleDislike,
    isLiked,
    isDisliked,
    toggleSubscription,
    isSubscribed,
    createPlaylist,
    deletePlaylist,
    togglePlaylistVideo,
    isInPlaylist,
    muteChannel,
    isMuted]

  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used inside a LibraryProvider');
  return context;
}