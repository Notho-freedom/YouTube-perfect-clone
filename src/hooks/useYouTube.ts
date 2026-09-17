import { useAuth } from '../contexts/AuthContext';
import type { ExploreSection } from '../data/explore';
import type { ChannelDetails, CommentThread, Video } from '../types/youtube';
import {
  assembleHomeFeed,
  rotationSlot,
  tasteProfile,
  topicKeywords,
  type TasteSignals } from
'../utils/recommendations';
import {
  fetchByCategory,
  fetchChannel,
  fetchComments,
  fetchLiveVideos,
  fetchMostPopular,
  fetchRelated,
  fetchSubscriptionUploads,
  fetchVideo,
  searchChannel,
  searchShorts,
  searchVideos,
  YouTubeApiError } from
'../utils/youtubeApi';
import { useAsync } from './useAsync';

export interface FeedResult {
  videos: Video[];
  shorts: Video[];
  loading: boolean;
  /** The read failed outright: render an empty state, never stand-in content. */
  failed: boolean;
}

/**
 * Coarse fingerprint of the viewer's taste. Deliberately coarse: it must not
 * change on every watched video, otherwise the home feed would refetch and
 * reshuffle constantly instead of staying put the way YouTube's does.
 */
function signalsKey(signals: TasteSignals): string {
  return [
  signals.subscriptions.length,
  signals.liked.length,
  Math.floor(signals.history.length / 5),
  (signals.mutedChannels ?? []).length].
  join('|');
}

export function useHomeFeed(chip: string, signals: TasteSignals): FeedResult {
  const { providerToken } = useAuth();
  const key = signalsKey(signals);
  const slot = rotationSlot();

  const state = useAsync(async () => {
    const profile = tasteProfile(signals, 6);
    const topics = profile.map((topic) => topic.keyword);

    if (chip === 'Live') {
      const videos = await fetchLiveVideos(topics[0] ?? 'live', 24);
      return { videos, shorts: [] as Video[] };
    }

    // "Watched" and "Unwatched" are lenses over the personalised feed rather
    // than search terms — searching for the word would return nonsense.
    const lens = chip === 'Watched' || chip === 'Unwatched' ? chip : null;

    if (chip !== 'All' && !lens) {
      const videos = await searchVideos(chip, 24);
      const shorts = await searchShorts(chip, 12).catch(() => [] as Video[]);
      return { videos, shorts };
    }

    const [subscription, trending] = await Promise.all([
    providerToken && signals.subscriptions.length > 0 ?
    fetchSubscriptionUploads(signals.subscriptions, 12, 3).catch(() => [] as Video[]) :
    Promise.resolve([] as Video[]),
    fetchMostPopular(24).catch(() => [] as Video[])]
    );

    // One query per dominant topic, sized by that topic's share of the taste
    // profile: a third of the profile buys roughly a third of the candidates.
    const leading = profile.slice(0, 2);
    const tasteLists = await Promise.all(
      leading.map((topic) =>
      searchVideos(topic.keyword, Math.max(8, Math.round(topic.share * 40))).catch(
        () => [] as Video[]
      )
      )
    );
    const taste = tasteLists.flat();

    const assembled = assembleHomeFeed({ subscription, taste, trending }, signals, 32, slot);

    const seen = new Set(signals.history.map((entry) => entry.video.id));
    const videos =
    lens === 'Watched' ?
    assembled.filter((video) => seen.has(video.id)) :
    lens === 'Unwatched' ?
    assembled.filter((video) => !seen.has(video.id)) :
    assembled;


    const shorts = await searchShorts(topics[0] ?? 'shorts', 12).catch(() => [] as Video[]);
    return { videos, shorts };
  }, [chip, providerToken, key, slot]);

  // A failed read returns nothing at all. Inventing plausible-looking videos
  // would make a broken key or an exhausted quota invisible, so the pages
  // render YouTube's own empty state instead.
  return {
    videos: state.data?.videos ?? [],
    shorts: state.data?.shorts ?? [],
    loading: state.loading,
    failed: Boolean(state.error)
  };
}

/** Vertical Shorts feed, seeded with the viewer's own topics when available. */
export function useShortsFeed(signals: TasteSignals): {shorts: Video[];loading: boolean;} {
  const topics = topicKeywords(signals, 3);
  const seed = topics[0] ?? 'shorts';

  const state = useAsync(async () => {
    const results = await searchShorts(seed, 24);
    return results.filter((video) => video.thumbnail);
  }, [seed]);

  return { shorts: state.data ?? [], loading: state.loading };
}

export function useExploreFeed(section?: ExploreSection): {videos: Video[];loading: boolean;} {
  const state = useAsync(async () => {
    if (!section) return [] as Video[];
    if (section.live) return fetchLiveVideos(section.query ?? 'live', 24);
    if (section.categoryId) {
      const byCategory = await fetchByCategory(section.categoryId, 24).catch(() => [] as Video[]);
      if (byCategory.length > 0) return byCategory;
    }
    if (section.query) return searchVideos(section.query, 24);
    return fetchMostPopular(24);
  }, [section?.slug]);

  return { videos: state.data ?? [], loading: state.loading };
}

export interface SearchResult {
  videos: Video[];
  shorts: Video[];
  channel: ChannelDetails | null;
  loading: boolean;
  failed: boolean;
}

export function useSearchFeed(query: string): SearchResult {
  const state = useAsync(async () => {
    if (!query.trim()) return { videos: [], shorts: [], channel: null };
    const [videos, channel, shorts] = await Promise.all([
    searchVideos(query, 20),
    searchChannel(query).catch(() => null),
    searchShorts(query, 12).catch(() => [])]
    );
    return { videos, channel, shorts };
  }, [query]);

  return {
    videos: state.data?.videos ?? [],
    shorts: state.data?.shorts ?? [],
    channel: state.data?.channel ?? null,
    loading: state.loading,
    failed: Boolean(state.error)
  };
}

export interface WatchData {
  video: Video;
  channel?: ChannelDetails;
  comments: CommentThread[];
  commentsDisabled: boolean;
  commentCount?: number;
  related: Video[];
}

export interface WatchResult {
  data: WatchData | undefined;
  loading: boolean;
  failed: boolean;
}

export function useWatchData(videoId: string): WatchResult {
  const state = useAsync(async () => {
    if (!videoId) throw new YouTubeApiError(404, 'No video id');
    const video = await fetchVideo(videoId);
    const [channel, comments, related] = await Promise.all([
    fetchChannel(video.channelId).catch(() => undefined),
    fetchComments(videoId).catch(() => ({
      threads: [] as CommentThread[],
      disabled: false,
      total: undefined
    })),
    fetchRelated(video).catch(() => [] as Video[])]
    );
    return {
      video: { ...video, channelAvatar: channel?.avatar ?? video.channelAvatar },
      channel,
      comments: comments.threads,
      commentsDisabled: comments.disabled,
      commentCount: comments.total,
      related
    };
  }, [videoId]);

  return { data: state.data, loading: state.loading, failed: Boolean(state.error) };
}