import { useLibrary } from '../contexts/LibraryContext';
import type { PlaylistSummary, Video } from '../types/youtube';
import { isMixId, loadMix } from '../utils/mixes';
import { fetchPlaylistMeta, fetchPlaylistVideos } from '../utils/youtubeApi';
import { useAsync } from './useAsync';
import { useLikedVideos, useTasteSignals } from './useMyYouTube';

export interface LoadedPlaylist {
  id: string;
  title: string;
  subtitle: string;
  videos: Video[];
  meta?: PlaylistSummary;
  /** Local lists can be edited from the playlist view. */
  local: boolean;
}

/**
 * Resolves every kind of list the clone can play: real YouTube playlists,
 * the local Watch later list, YouTube "liked videos" and generated mixes.
 */
export function usePlaylist(listId: string | null): {
  playlist: LoadedPlaylist | undefined;
  loading: boolean;
  error: Error | undefined;
} {
  const { watchLater, playlists: localPlaylists } = useLibrary();
  const signals = useTasteSignals();
  const { videos: liked, loading: likedLoading } = useLikedVideos(
    listId === 'LL' ? 50 : 1
  );

  const signalKey = `${signals.history.length}|${signals.liked.length}`;

  const state = useAsync(async () => {
    if (!listId) return undefined;

    if (isMixId(listId)) {
      const mix = await loadMix(listId, signals);
      return {
        id: mix.id,
        title: mix.title,
        subtitle: mix.subtitle,
        videos: mix.videos,
        local: false
      } satisfies LoadedPlaylist;
    }

    const [meta, videos] = await Promise.all([
    fetchPlaylistMeta(listId).catch(() => undefined),
    fetchPlaylistVideos(listId, 50)]
    );

    return {
      id: listId,
      title: meta?.title ?? 'Playlist',
      subtitle: meta?.channelTitle ?? '',
      videos,
      meta,
      local: false
    } satisfies LoadedPlaylist;
  }, [listId, signalKey]);

  if (listId === 'WL') {
    return {
      playlist: {
        id: 'WL',
        title: 'Watch later',
        subtitle: 'Private • saved in this browser',
        videos: watchLater,
        local: true
      },
      loading: false,
      error: undefined
    };
  }

  // Playlists created inside the clone.
  const local = listId ? localPlaylists.find((playlist) => playlist.id === listId) : undefined;
  if (local) {
    return {
      playlist: {
        id: local.id,
        title: local.title,
        subtitle: 'Private • created in this clone',
        videos: local.videos,
        local: true
      },
      loading: false,
      error: undefined
    };
  }

  if (listId === 'LL') {
    return {
      playlist: {
        id: 'LL',
        title: 'Liked videos',
        subtitle: 'Private • from your YouTube account',
        videos: liked,
        local: false
      },
      loading: likedLoading,
      error: undefined
    };
  }

  return { playlist: state.data, loading: state.loading, error: state.error };
}