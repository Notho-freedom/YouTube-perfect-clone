import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLibrary } from '../contexts/LibraryContext';
import type { MyChannel, PlaylistSummary, SubscriptionItem, Video } from '../types/youtube';
import type { TasteSignals } from '../utils/recommendations';
import {
  fetchLikedVideos,
  fetchMyChannel,
  fetchMyPlaylists,
  fetchMySubscriptions,
  fetchPlaylistVideoIds,
  fetchSubscriptionUploads,
  fetchVideosByIds,
  YouTubeApiError } from
'../utils/youtubeApi';
import { useAsync } from './useAsync';

/** True when the Google access token is missing or no longer accepted. */
export function needsReconnect(error?: Error): boolean {
  return error instanceof YouTubeApiError && (error.status === 401 || error.status === 403);
}

export function useMySubscriptions(): {
  subscriptions: SubscriptionItem[];
  loading: boolean;
  error: Error | undefined;
} {
  const { providerToken } = useAuth();
  const { subscriptions: nativeSubscriptions } = useLibrary();
  const state = useAsync(
    async () => providerToken ? fetchMySubscriptions(50) : [],
    [providerToken]
  );

  // Native follows come first so they show up instantly, without a round trip.
  const subscriptions = useMemo(() => {
    const byId = new Map<string, SubscriptionItem>();
    nativeSubscriptions.forEach((item) => byId.set(item.channelId, item));
    (state.data ?? []).forEach((item) => {
      if (!byId.has(item.channelId)) byId.set(item.channelId, item);
    });
    return Array.from(byId.values());
  }, [nativeSubscriptions, state.data]);

  return {
    subscriptions,
    loading: Boolean(providerToken) && state.loading,
    error: state.error
  };
}

export function useMyChannel(): {
  channel: MyChannel | undefined;
  loading: boolean;
  error: Error | undefined;
} {
  const { providerToken } = useAuth();
  const state = useAsync(
    async () => providerToken ? fetchMyChannel() : undefined,
    [providerToken]
  );
  return {
    channel: state.data,
    loading: Boolean(providerToken) && state.loading,
    error: state.error
  };
}

export function useMyPlaylists(): {
  playlists: PlaylistSummary[];
  loading: boolean;
  error: Error | undefined;
} {
  const { providerToken } = useAuth();
  const state = useAsync(async () => providerToken ? fetchMyPlaylists(50) : [], [providerToken]);
  return {
    playlists: state.data ?? [],
    loading: Boolean(providerToken) && state.loading,
    error: state.error
  };
}

export function useLikedVideos(maxResults = 24): {
  videos: Video[];
  loading: boolean;
  error: Error | undefined;
} {
  const { providerToken } = useAuth();
  const state = useAsync(
    async () => providerToken ? fetchLikedVideos(maxResults) : [],
    [providerToken, maxResults]
  );
  return {
    videos: state.data ?? [],
    loading: Boolean(providerToken) && state.loading,
    error: state.error
  };
}

export function useMyUploads(uploadsPlaylistId?: string): {videos: Video[];loading: boolean;} {
  const { providerToken } = useAuth();
  const state = useAsync(async () => {
    if (!providerToken || !uploadsPlaylistId) return [] as Video[];
    const ids = await fetchPlaylistVideoIds(uploadsPlaylistId, 12);
    if (ids.length === 0) return [] as Video[];
    return fetchVideosByIds(ids);
  }, [providerToken, uploadsPlaylistId]);

  return { videos: state.data ?? [], loading: Boolean(uploadsPlaylistId) && state.loading };
}

/**
 * Uploads from every channel the viewer follows — from YouTube when the scope
 * is granted, plus the channels they followed natively in the clone.
 */
export function useSubscriptionFeed(): {
  videos: Video[];
  loading: boolean;
  error: Error | undefined;
} {
  const { providerToken } = useAuth();
  const { subscriptions: nativeSubscriptions } = useLibrary();
  const nativeKey = nativeSubscriptions.map((item) => item.channelId).join(',');

  const state = useAsync(async () => {
    const remote = providerToken ? await fetchMySubscriptions(50).catch(() => []) : [];
    const byId = new Map<string, SubscriptionItem>();
    nativeSubscriptions.forEach((item) => byId.set(item.channelId, item));
    remote.forEach((item) => byId.set(item.channelId, item));
    const all = Array.from(byId.values());
    if (all.length === 0) return [] as Video[];
    return fetchSubscriptionUploads(all, 20, 5);
  }, [providerToken, nativeKey]);

  return {
    videos: state.data ?? [],
    loading: state.loading,
    error: state.error
  };
}

/**
 * Everything the recommendation engine needs, merging the two worlds: the
 * read-only YouTube account (when the scope is granted) and the clone's own
 * native library, so a Google-only sign-in still gets real personalisation.
 */
export function useTasteSignals(): TasteSignals & {loading: boolean;} {
  const { subscriptions: remoteSubscriptions, loading: subscriptionsLoading } = useMySubscriptions();
  const { videos: remoteLiked, loading: likedLoading } = useLikedVideos(20);
  const {
    history,
    likes,
    dislikes,
    subscriptions: nativeSubscriptions,
    mutedChannels,
    watchSeconds
  } = useLibrary();

  const subscriptions = useMemo(() => {
    const byId = new Map<string, SubscriptionItem>();
    nativeSubscriptions.forEach((item) => byId.set(item.channelId, item));
    remoteSubscriptions.forEach((item) => {
      if (!byId.has(item.channelId)) byId.set(item.channelId, item);
    });
    return Array.from(byId.values());
  }, [nativeSubscriptions, remoteSubscriptions]);

  const liked = useMemo(() => {
    const byId = new Map<string, Video>();
    likes.forEach((video) => byId.set(video.id, video));
    remoteLiked.forEach((video) => {
      if (!byId.has(video.id)) byId.set(video.id, video);
    });
    return Array.from(byId.values());
  }, [likes, remoteLiked]);

  return {
    subscriptions,
    liked,
    history,
    dislikes,
    mutedChannels,
    watchSeconds,
    loading: subscriptionsLoading || likedLoading
  };
}