import { useCallback } from 'react';
import { useLibrary } from '../contexts/LibraryContext';
import type { Video } from '../types/youtube';
import { isMixId, loadMix } from '../utils/mixes';
import { fetchPlaylistVideos } from '../utils/youtubeApi';
import { useTasteSignals } from './useMyYouTube';

/**
 * Loads the first videos of any list on demand — used by "Play all" buttons so
 * a playlist can start playing without opening the playlist page first.
 */
export function usePlaylistPreview(): {load: (listId: string) => Promise<Video[]>;} {
  const { watchLater, playlists } = useLibrary();
  const signals = useTasteSignals();

  const load = useCallback(
    async (listId: string): Promise<Video[]> => {
      if (listId === 'WL') return watchLater;
      const local = playlists.find((playlist) => playlist.id === listId);
      if (local) return local.videos;
      if (isMixId(listId)) {
        const mix = await loadMix(listId, signals).catch(() => undefined);
        return mix?.videos ?? [];
      }
      return fetchPlaylistVideos(listId, 50).catch(() => []);
    },
    [watchLater, playlists, signals]
  );

  return { load };
}