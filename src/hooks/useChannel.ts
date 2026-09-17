import type { ChannelProfile, PlaylistSummary, Video } from '../types/youtube';
import {
  fetchChannelPlaylists,
  fetchChannelProfile,
  fetchChannelShorts,
  fetchPlaylistVideos } from
'../utils/youtubeApi';
import { useAsync } from './useAsync';

export function useChannelProfile(channelId: string): {
  channel: ChannelProfile | undefined;
  loading: boolean;
  error: Error | undefined;
} {
  const state = useAsync(
    async () => channelId ? fetchChannelProfile(channelId) : undefined,
    [channelId]
  );
  return { channel: state.data, loading: state.loading, error: state.error };
}

export function useChannelVideos(uploadsPlaylistId?: string): {
  videos: Video[];
  loading: boolean;
} {
  const state = useAsync(
    async () => uploadsPlaylistId ? fetchPlaylistVideos(uploadsPlaylistId, 24) : [],
    [uploadsPlaylistId]
  );
  return { videos: state.data ?? [], loading: Boolean(uploadsPlaylistId) && state.loading };
}

/** Only fetched when the Playlists tab is opened — searches cost quota. */
export function useChannelPlaylists(
channelId: string,
enabled: boolean)
: {playlists: PlaylistSummary[];loading: boolean;} {
  const state = useAsync(
    async () => enabled && channelId ? fetchChannelPlaylists(channelId, 24) : [],
    [channelId, enabled]
  );
  return { playlists: state.data ?? [], loading: enabled && state.loading };
}

export function useChannelShorts(
channelId: string,
enabled: boolean)
: {shorts: Video[];loading: boolean;} {
  const state = useAsync(
    async () => enabled && channelId ? fetchChannelShorts(channelId, 18) : [],
    [channelId, enabled]
  );
  return { shorts: state.data ?? [], loading: enabled && state.loading };
}