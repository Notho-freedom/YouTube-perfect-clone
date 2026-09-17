import { useAsync } from './useAsync';
import { useTasteSignals } from './useMyYouTube';
import type { Video } from '../types/youtube';
import { topicKeywords } from '../utils/recommendations';
import { searchVideos } from '../utils/youtubeApi';

export interface PodcastShow {
  channelId: string;
  title: string;
  thumbnail?: string;
  episodes: Video[];
}

/**
 * The Data API has no podcast entity, so shows are reconstructed: search the
 * listener's own topics for podcast episodes, then group the results by the
 * channel that published them. A channel with several long episodes is, for
 * practical purposes, a show.
 */
export function useMusicPodcasts(enabled: boolean): {
  shows: PodcastShow[];
  loading: boolean;
} {
  const signals = useTasteSignals();
  const topics = topicKeywords(signals, 2);
  const key = enabled ? topics.join('|') || 'default' : 'off';

  const state = useAsync(async (): Promise<PodcastShow[]> => {
    if (!enabled) return [];

    const queries = topics.length > 0 ? topics.map((topic) => `${topic} podcast`) : ['podcast'];
    const batches = await Promise.all(
      queries.map((query) => searchVideos(query, 25).catch((): Video[] => []))
    );

    const byChannel = new Map<string, PodcastShow>();
    for (const video of batches.flat()) {
      const existing = byChannel.get(video.channelId);
      if (existing) {
        existing.episodes.push(video);
        continue;
      }
      byChannel.set(video.channelId, {
        channelId: video.channelId,
        title: video.channelTitle,
        thumbnail: video.thumbnail,
        episodes: [video]
      });
    }

    // A single stray match isn't a show — require a body of work.
    return [...byChannel.values()].
    filter((show) => show.episodes.length >= 2).
    sort((a, b) => b.episodes.length - a.episodes.length).
    slice(0, 24);
  }, [key]);

  return { shows: state.data ?? [], loading: state.loading };
}