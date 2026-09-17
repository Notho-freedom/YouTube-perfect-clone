import type {
  ChannelDetails,
  ChannelProfile,
  CommentThread,
  MyChannel,
  PlaylistSummary,
  SubscriptionItem,
  Video } from
'../types/youtube';
import { cached, TTL } from './cache';
import { QuotaExceededError, reserve } from './quota';
import { SUPABASE_ANON_KEY } from './supabase';

const API_KEY = 'AIzaSyBmSKgUHhbRaE3d1RzgDodNZE0NTZn-LxE';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const REGION_CODE = 'FR';

/**
 * Deployed `yt-proxy` Edge Function (see supabase/functions/yt-proxy): it holds
 * the API key and the shared Redis cache. Set it to '' to call the YouTube API
 * straight from the browser instead.
 */
export const EDGE_PROXY_URL =
'https://zwizipjggvnwcvycdrhn.supabase.co/functions/v1/yt-proxy';

/**
 * Flipped off for the session if the proxy is unreachable or misconfigured
 * (missing secrets, JWT rejection): the app then talks to YouTube directly so
 * nothing breaks while the function is being set up.
 */
let proxyHealthy = true;

export function isProxyActive(): boolean {
  return EDGE_PROXY_URL.length > 0 && proxyHealthy;
}

/** OAuth access token of the signed-in viewer, when available. */
let authToken: string | null = null;
let onAuthInvalid: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function hasAuthToken(): boolean {
  return Boolean(authToken);
}

export function setAuthInvalidHandler(handler: (() => void) | null): void {
  onAuthInvalid = handler;
}

export class YouTubeApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'YouTubeApiError';
    this.status = status;
  }
}

type Params = Record<string, string | number | boolean | undefined>;

interface ApiThumbnail {
  url: string;
}

interface ApiSnippet {
  title?: string;
  description?: string;
  publishedAt?: string;
  channelId?: string;
  channelTitle?: string;
  liveBroadcastContent?: string;
  customUrl?: string;
  resourceId?: {channelId?: string;videoId?: string;};
  thumbnails?: Record<string, ApiThumbnail | undefined>;
}

interface ApiItem {
  id: string | {videoId?: string;channelId?: string;playlistId?: string;};
  snippet?: ApiSnippet;
  statistics?: {
    viewCount?: string;
    subscriberCount?: string;
    likeCount?: string;
    commentCount?: string;
    videoCount?: string;
  };
  contentDetails?: {
    duration?: string;
    itemCount?: number;
    videoId?: string;
    totalItemCount?: number;
    newItemCount?: number;
    relatedPlaylists?: {uploads?: string;likes?: string;};
  };
  status?: {privacyStatus?: string;};
  brandingSettings?: {image?: {bannerExternalUrl?: string;};};
}

interface ApiListResponse<T> {
  items?: T[];
  pageInfo?: {totalResults?: number;};
  nextPageToken?: string;
}

interface RequestOptions {
  /** mine=true style endpoints cannot fall back to the public API key. */
  requireAuth?: boolean;
}

function ttlFor(path: string, params: Params): number {
  if (path === 'videos') {
    if (params.myRating) return TTL.personal;
    if (params.chart) return TTL.trending;
    return TTL.videos;
  }
  if (path === 'channels') return params.mine ? TTL.mine : TTL.channels;
  if (path === 'subscriptions' || path === 'playlists') return TTL.mine;
  if (path === 'search') return params.eventType === 'live' ? TTL.trending : TTL.search;
  return TTL.search;
}

function cacheKeyFor(path: string, params: Params, useAuth: boolean): string {
  const serialised = Object.keys(params).
  sort().
  filter((key) => params[key] !== undefined && params[key] !== '').
  map((key) => `${key}=${String(params[key])}`).
  join('&');
  return `yt:${useAuth ? 'me' : 'pub'}:${path}?${serialised}`;
}

async function performFetch<T>(path: string, params: Params, useAuth: boolean): Promise<T> {
  const viaProxy = isProxyActive();

  // Last gate before the network. The cache has already missed, so this call
  // would genuinely spend units — refuse it locally once the day's budget is
  // gone rather than letting Google return 403 after the fact. Refusing is
  // free and surfaces as an honest empty state.
  if (!reserve(path)) throw new QuotaExceededError(path);

  const url = new URL(viaProxy ? EDGE_PROXY_URL : `${BASE_URL}/${path}`);
  if (viaProxy) url.searchParams.set('path', path);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (viaProxy) {
    headers.apikey = SUPABASE_ANON_KEY;
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
    if (useAuth && authToken) headers['X-YouTube-Token'] = authToken;
  } else if (useAuth && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  } else {
    url.searchParams.set('key', API_KEY);
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), { headers });
  } catch (networkError) {
    if (viaProxy) {
      proxyHealthy = false;
      return performFetch<T>(path, params, useAuth);
    }
    throw networkError;
  }

  const raw = await response.text();
  let parsed: {error?: {message?: string;} | string;} | undefined;
  try {
    parsed = JSON.parse(raw) as {error?: {message?: string;} | string;};
  } catch {
    parsed = undefined;
  }

  if (!response.ok) {
    const youtubeMessage =
    parsed && typeof parsed.error === 'object' ? parsed.error?.message : undefined;

    // No YouTube error payload means the gateway itself refused the call
    // (missing secrets, JWT verification, cold start) — retry without it.
    if (viaProxy && !youtubeMessage) {
      proxyHealthy = false;
      return performFetch<T>(path, params, useAuth);
    }

    throw new YouTubeApiError(
      response.status,
      `YouTube API ${response.status}: ${youtubeMessage ?? response.statusText}`
    );
  }

  return (parsed ?? JSON.parse(raw)) as T;
}

/**
 * Every read goes through the cache: the daily quota is the scarce resource.
 * Memory → localStorage → Redis, and only a true miss calls `performFetch`,
 * where the quota ledger gets its say.
 */
async function fetchOnce<T>(path: string, params: Params, useAuth: boolean): Promise<T> {
  return cached(cacheKeyFor(path, params, useAuth), ttlFor(path, params), () =>
  performFetch<T>(path, params, useAuth)
  );
}

async function request<T>(path: string, params: Params, options: RequestOptions = {}): Promise<T> {
  if (!authToken) {
    if (options.requireAuth) throw new YouTubeApiError(401, 'Not signed in');
    return fetchOnce<T>(path, params, false);
  }

  try {
    return await fetchOnce<T>(path, params, true);
  } catch (error) {
    const status = error instanceof YouTubeApiError ? error.status : 0;

    // 401 = expired token. 403 with a scope complaint = the account signed in
    // without the YouTube scope. Either way the token is useless: drop it and
    // serve the call with the public key, so public browsing never depends on
    // how the viewer signed in. A 403 about quota is NOT swallowed here.
    const scopeProblem =
    status === 403 && /scope|insufficient|permission/i.test((error as Error).message);

    if (status === 401 || scopeProblem) {
      authToken = null;
      if (status === 401) onAuthInvalid?.();
      if (options.requireAuth) throw error;
      return fetchOnce<T>(path, params, false);
    }
    throw error;
  }
}

export function decodeEntities(text: string): string {
  return text.
  replace(/&amp;/g, '&').
  replace(/&quot;/g, '"').
  replace(/&#39;/g, "'").
  replace(/&lt;/g, '<').
  replace(/&gt;/g, '>');
}

function pickThumbnail(snippet?: ApiSnippet): string {
  const thumbs = snippet?.thumbnails ?? {};
  return (
    thumbs.maxres?.url ??
    thumbs.standard?.url ??
    thumbs.high?.url ??
    thumbs.medium?.url ??
    thumbs.default?.url ??
    '');

}

function toVideo(item: ApiItem): Video {
  const id =
  typeof item.id === 'string' ?
  item.id :
  item.id?.videoId ?? item.contentDetails?.videoId ?? '';
  const snippet = item.snippet;
  return {
    id,
    title: decodeEntities(snippet?.title ?? ''),
    description: decodeEntities(snippet?.description ?? ''),
    thumbnail: pickThumbnail(snippet),
    publishedAt: snippet?.publishedAt ?? '',
    channelId: snippet?.channelId ?? '',
    channelTitle: decodeEntities(snippet?.channelTitle ?? ''),
    views: item.statistics?.viewCount ? Number(item.statistics.viewCount) : undefined,
    likes: item.statistics?.likeCount ? Number(item.statistics.likeCount) : undefined,
    commentCount: item.statistics?.commentCount ? Number(item.statistics.commentCount) : undefined,
    duration: item.contentDetails?.duration,
    isLive: snippet?.liveBroadcastContent === 'live'
  };
}

async function fetchAvatars(channelIds: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(channelIds.filter(Boolean))).slice(0, 50);
  if (unique.length === 0) return {};
  const data = await request<ApiListResponse<ApiItem>>('channels', {
    part: 'snippet',
    id: unique.join(','),
    maxResults: 50
  });
  const map: Record<string, string> = {};
  for (const item of data.items ?? []) {
    const id = typeof item.id === 'string' ? item.id : '';
    const thumbs = item.snippet?.thumbnails ?? {};
    if (id) map[id] = thumbs.medium?.url ?? thumbs.default?.url ?? '';
  }
  return map;
}

async function withAvatars(videos: Video[]): Promise<Video[]> {
  try {
    const avatars = await fetchAvatars(videos.map((video) => video.channelId));
    return videos.map((video) => ({ ...video, channelAvatar: avatars[video.channelId] }));
  } catch {
    return videos;
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function hydrateVideoIds(ids: string[]): Promise<Video[]> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return [];
  const batches = await Promise.all(
    chunk(unique, 50).map((batch) =>
    request<ApiListResponse<ApiItem>>('videos', {
      part: 'snippet,statistics,contentDetails',
      id: batch.join(','),
      maxResults: 50
    })
    )
  );
  const byId = new Map<string, Video>();
  for (const batch of batches) {
    for (const item of batch.items ?? []) {
      const video = toVideo(item);
      byId.set(video.id, video);
    }
  }
  return unique.map((id) => byId.get(id)).filter((video): video is Video => Boolean(video));
}

/* ------------------------------------------------------------------ public */

export async function fetchMostPopular(maxResults = 24): Promise<Video[]> {
  const data = await request<ApiListResponse<ApiItem>>('videos', {
    part: 'snippet,statistics,contentDetails',
    chart: 'mostPopular',
    regionCode: REGION_CODE,
    maxResults
  });
  return withAvatars((data.items ?? []).map(toVideo));
}

export async function searchVideos(query: string, maxResults = 20): Promise<Video[]> {
  const data = await request<ApiListResponse<ApiItem>>('search', {
    part: 'snippet',
    q: query,
    type: 'video',
    regionCode: REGION_CODE,
    maxResults
  });
  const ids = (data.items ?? []).
  map((item) => typeof item.id === 'string' ? item.id : item.id?.videoId).
  filter((id): id is string => Boolean(id));
  return withAvatars(await hydrateVideoIds(ids));
}

export async function searchShorts(query: string, maxResults = 8): Promise<Video[]> {
  const data = await request<ApiListResponse<ApiItem>>('search', {
    part: 'snippet',
    q: `${query} #shorts`,
    type: 'video',
    videoDuration: 'short',
    regionCode: REGION_CODE,
    maxResults
  });
  const ids = (data.items ?? []).
  map((item) => typeof item.id === 'string' ? item.id : item.id?.videoId).
  filter((id): id is string => Boolean(id));
  return hydrateVideoIds(ids);
}

export async function fetchVideo(videoId: string): Promise<Video> {
  const videos = await hydrateVideoIds([videoId]);
  if (videos.length === 0) throw new YouTubeApiError(404, 'Video not found');
  return videos[0];
}

export async function fetchVideosByIds(ids: string[]): Promise<Video[]> {
  return withAvatars(await hydrateVideoIds(ids));
}

export async function fetchByCategory(categoryId: string, maxResults = 24): Promise<Video[]> {
  const data = await request<ApiListResponse<ApiItem>>('videos', {
    part: 'snippet,statistics,contentDetails',
    chart: 'mostPopular',
    videoCategoryId: categoryId,
    regionCode: REGION_CODE,
    maxResults
  });
  return withAvatars((data.items ?? []).map(toVideo));
}

export async function fetchLiveVideos(query: string, maxResults = 24): Promise<Video[]> {
  const data = await request<ApiListResponse<ApiItem>>('search', {
    part: 'snippet',
    q: query,
    type: 'video',
    eventType: 'live',
    regionCode: REGION_CODE,
    maxResults
  });
  const ids = (data.items ?? []).
  map((item) => typeof item.id === 'string' ? item.id : item.id?.videoId).
  filter((id): id is string => Boolean(id));
  const videos = await withAvatars(await hydrateVideoIds(ids));
  return videos.map((video) => ({ ...video, isLive: true }));
}

export async function fetchPlaylistVideos(playlistId: string, maxResults = 24): Promise<Video[]> {
  const ids = await fetchPlaylistVideoIds(playlistId, maxResults);
  return fetchVideosByIds(ids);
}

export async function fetchPlaylistMeta(playlistId: string): Promise<PlaylistSummary> {
  const data = await request<ApiListResponse<ApiItem>>('playlists', {
    part: 'snippet,contentDetails,status',
    id: playlistId
  });
  const item = data.items?.[0];
  if (!item) throw new YouTubeApiError(404, 'Playlist not found');
  return {
    id: playlistId,
    title: decodeEntities(item.snippet?.title ?? ''),
    description: decodeEntities(item.snippet?.description ?? ''),
    thumbnail: pickThumbnail(item.snippet),
    itemCount: item.contentDetails?.itemCount ?? 0,
    channelTitle: decodeEntities(item.snippet?.channelTitle ?? ''),
    privacyStatus: item.status?.privacyStatus
  };
}

export async function fetchChannelProfile(channelId: string): Promise<ChannelProfile> {
  const data = await request<ApiListResponse<ApiItem>>('channels', {
    part: 'snippet,statistics,contentDetails,brandingSettings',
    id: channelId
  });
  const item = data.items?.[0];
  if (!item) throw new YouTubeApiError(404, 'Channel not found');
  const thumbs = item.snippet?.thumbnails ?? {};
  const banner = item.brandingSettings?.image?.bannerExternalUrl;

  return {
    id: channelId,
    title: decodeEntities(item.snippet?.title ?? ''),
    handle: item.snippet?.customUrl,
    avatar: thumbs.high?.url ?? thumbs.medium?.url ?? thumbs.default?.url,
    banner: banner ? `${banner}=w2560-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj` : undefined,
    subscribers: item.statistics?.subscriberCount ?
    Number(item.statistics.subscriberCount) :
    undefined,
    videoCount: item.statistics?.videoCount ? Number(item.statistics.videoCount) : undefined,
    totalViews: item.statistics?.viewCount ? Number(item.statistics.viewCount) : undefined,
    description: decodeEntities(item.snippet?.description ?? ''),
    publishedAt: item.snippet?.publishedAt,
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads
  };
}

export async function fetchChannelPlaylists(
channelId: string,
maxResults = 24)
: Promise<PlaylistSummary[]> {
  const data = await request<ApiListResponse<ApiItem>>('playlists', {
    part: 'snippet,contentDetails,status',
    channelId,
    maxResults
  });
  return (data.items ?? []).map((item) => ({
    id: typeof item.id === 'string' ? item.id : '',
    title: decodeEntities(item.snippet?.title ?? ''),
    description: decodeEntities(item.snippet?.description ?? ''),
    thumbnail: pickThumbnail(item.snippet),
    itemCount: item.contentDetails?.itemCount ?? 0,
    channelTitle: decodeEntities(item.snippet?.channelTitle ?? ''),
    privacyStatus: item.status?.privacyStatus
  }));
}

export async function fetchChannelShorts(channelId: string, maxResults = 12): Promise<Video[]> {
  const data = await request<ApiListResponse<ApiItem>>('search', {
    part: 'snippet',
    channelId,
    type: 'video',
    videoDuration: 'short',
    order: 'date',
    maxResults
  });
  const ids = (data.items ?? []).
  map((item) => typeof item.id === 'string' ? item.id : item.id?.videoId).
  filter((id): id is string => Boolean(id));
  return hydrateVideoIds(ids);
}

export async function fetchChannel(channelId: string): Promise<ChannelDetails> {
  const data = await request<ApiListResponse<ApiItem>>('channels', {
    part: 'snippet,statistics',
    id: channelId
  });
  const item = data.items?.[0];
  const thumbs = item?.snippet?.thumbnails ?? {};
  return {
    id: channelId,
    title: decodeEntities(item?.snippet?.title ?? ''),
    handle: item?.snippet?.customUrl,
    avatar: thumbs.medium?.url ?? thumbs.default?.url,
    subscribers: item?.statistics?.subscriberCount ?
    Number(item.statistics.subscriberCount) :
    undefined,
    description: decodeEntities(item?.snippet?.description ?? '')
  };
}

export async function searchChannel(query: string): Promise<ChannelDetails | null> {
  const data = await request<ApiListResponse<ApiItem>>('search', {
    part: 'snippet',
    q: query,
    type: 'channel',
    maxResults: 1
  });
  const item = data.items?.[0];
  const channelId = typeof item?.id === 'string' ? item.id : item?.id?.channelId;
  if (!channelId) return null;
  return fetchChannel(channelId);
}

interface ApiCommentThread {
  id: string;
  snippet?: {
    totalReplyCount?: number;
    topLevelComment?: {
      snippet?: {
        authorDisplayName?: string;
        authorProfileImageUrl?: string;
        publishedAt?: string;
        textOriginal?: string;
        textDisplay?: string;
        likeCount?: number;
      };
    };
  };
}

export interface CommentsResult {
  total?: number;
  threads: CommentThread[];
  /** True only when YouTube itself says comments are turned off. */
  disabled: boolean;
}

export async function fetchComments(
videoId: string,
maxResults = 20,
order: 'relevance' | 'time' = 'relevance')
: Promise<CommentsResult> {
  const load = (sort: 'relevance' | 'time') =>
  request<ApiListResponse<ApiCommentThread>>('commentThreads', {
    part: 'snippet',
    videoId,
    order: sort,
    textFormat: 'plainText',
    maxResults
  });

  let data: ApiListResponse<ApiCommentThread>;
  try {
    data = await load(order);
  } catch (error) {
    // 403 is the only answer that genuinely means "comments are off". A 400 is
    // YouTube refusing relevance ordering on this particular video, which is
    // common and used to be reported as "comments disabled" — retry by date.
    if (error instanceof YouTubeApiError && error.status === 403) {
      return { threads: [], disabled: true };
    }
    data = await load('time');
  }

  const threads: CommentThread[] = (data.items ?? []).map((item) => {
    const snippet = item.snippet?.topLevelComment?.snippet;
    return {
      id: item.id,
      author: snippet?.authorDisplayName ?? '',
      authorAvatar: snippet?.authorProfileImageUrl,
      publishedAt: snippet?.publishedAt ?? '',
      text: decodeEntities(snippet?.textOriginal ?? snippet?.textDisplay ?? ''),
      likes: snippet?.likeCount ?? 0,
      replyCount: item.snippet?.totalReplyCount ?? 0
    };
  });
  return { total: data.pageInfo?.totalResults, threads, disabled: false };
}

interface ApiComment {
  id: string;
  snippet?: {
    authorDisplayName?: string;
    authorProfileImageUrl?: string;
    publishedAt?: string;
    textOriginal?: string;
    textDisplay?: string;
    likeCount?: number;
  };
}

/** Replies under one top-level comment, loaded only when it is expanded. */
export async function fetchCommentReplies(
parentId: string,
maxResults = 50)
: Promise<CommentThread[]> {
  const data = await request<ApiListResponse<ApiComment>>('comments', {
    part: 'snippet',
    parentId,
    textFormat: 'plainText',
    maxResults
  });

  return (data.items ?? []).map((item) => ({
    id: item.id,
    author: item.snippet?.authorDisplayName ?? '',
    authorAvatar: item.snippet?.authorProfileImageUrl,
    publishedAt: item.snippet?.publishedAt ?? '',
    text: decodeEntities(item.snippet?.textOriginal ?? item.snippet?.textDisplay ?? ''),
    likes: item.snippet?.likeCount ?? 0,
    replyCount: 0
  }));
}

/**
 * The "next" rail. `relatedToVideoId` was removed from the API in 2023, so it
 * is rebuilt from searches, with progressively looser queries — a very long or
 * very unusual title can return nothing on the first, narrower attempt.
 */
export async function fetchRelated(video: Video, maxResults = 20): Promise<Video[]> {
  const words = video.title.
  replace(/[|()[\]#]/g, ' ').
  split(/\s+/).
  filter((word) => word.length > 2);

  const attempts = [
  `${words.slice(0, 5).join(' ')} ${video.channelTitle}`.trim(),
  words.slice(0, 4).join(' '),
  video.channelTitle].
  filter((query) => query.length > 1);

  for (const query of attempts) {
    const results = await searchVideos(query, maxResults).catch(() => [] as Video[]);
    const filtered = results.filter((item) => item.id !== video.id);
    if (filtered.length >= 4) return filtered;
  }

  // Last resort: never leave the rail empty.
  return (await fetchMostPopular(maxResults).catch(() => [] as Video[])).filter(
    (item) => item.id !== video.id
  );
}

/* ------------------------------------------------- signed-in viewer (OAuth) */

export async function fetchMySubscriptions(maxResults = 50): Promise<SubscriptionItem[]> {
  const data = await request<ApiListResponse<ApiItem>>(
    'subscriptions',
    {
      part: 'snippet,contentDetails',
      mine: true,
      order: 'alphabetical',
      maxResults
    },
    { requireAuth: true }
  );
  return (data.items ?? []).map((item) => {
    const thumbs = item.snippet?.thumbnails ?? {};
    return {
      channelId: item.snippet?.resourceId?.channelId ?? '',
      title: decodeEntities(item.snippet?.title ?? ''),
      avatar: thumbs.medium?.url ?? thumbs.default?.url,
      newItemCount: item.contentDetails?.newItemCount
    };
  });
}

export async function fetchMyChannel(): Promise<MyChannel> {
  const data = await request<ApiListResponse<ApiItem>>(
    'channels',
    { part: 'snippet,statistics,contentDetails', mine: true },
    { requireAuth: true }
  );
  const item = data.items?.[0];
  const thumbs = item?.snippet?.thumbnails ?? {};
  return {
    id: typeof item?.id === 'string' ? item.id : '',
    title: decodeEntities(item?.snippet?.title ?? ''),
    handle: item?.snippet?.customUrl,
    avatar: thumbs.medium?.url ?? thumbs.default?.url,
    subscribers: item?.statistics?.subscriberCount ?
    Number(item.statistics.subscriberCount) :
    undefined,
    videoCount: item?.statistics?.videoCount ? Number(item.statistics.videoCount) : undefined,
    uploadsPlaylistId: item?.contentDetails?.relatedPlaylists?.uploads
  };
}

export async function fetchMyPlaylists(maxResults = 50): Promise<PlaylistSummary[]> {
  const data = await request<ApiListResponse<ApiItem>>(
    'playlists',
    { part: 'snippet,contentDetails,status', mine: true, maxResults },
    { requireAuth: true }
  );
  return (data.items ?? []).map((item) => ({
    id: typeof item.id === 'string' ? item.id : '',
    title: decodeEntities(item.snippet?.title ?? ''),
    description: decodeEntities(item.snippet?.description ?? ''),
    thumbnail: pickThumbnail(item.snippet),
    itemCount: item.contentDetails?.itemCount ?? 0,
    channelTitle: decodeEntities(item.snippet?.channelTitle ?? ''),
    privacyStatus: item.status?.privacyStatus
  }));
}

export async function fetchLikedVideos(maxResults = 24): Promise<Video[]> {
  const data = await request<ApiListResponse<ApiItem>>(
    'videos',
    { part: 'snippet,statistics,contentDetails', myRating: 'like', maxResults },
    { requireAuth: true }
  );
  return withAvatars((data.items ?? []).map(toVideo));
}

export async function fetchPlaylistVideoIds(
playlistId: string,
maxResults = 10)
: Promise<string[]> {
  const data = await request<ApiListResponse<ApiItem>>('playlistItems', {
    part: 'contentDetails',
    playlistId,
    maxResults
  });
  return (data.items ?? []).
  map((item) => item.contentDetails?.videoId).
  filter((id): id is string => Boolean(id));
}

/** Recent uploads from the channels the viewer subscribes to, newest first. */
export async function fetchSubscriptionUploads(
subscriptions: SubscriptionItem[],
channelLimit = 12,
perChannel = 4)
: Promise<Video[]> {
  const channelIds = subscriptions.slice(0, channelLimit).map((item) => item.channelId);
  if (channelIds.length === 0) return [];

  const channelData = await request<ApiListResponse<ApiItem>>('channels', {
    part: 'contentDetails',
    id: channelIds.join(','),
    maxResults: 50
  });
  const uploadPlaylists = (channelData.items ?? []).
  map((item) => item.contentDetails?.relatedPlaylists?.uploads).
  filter((id): id is string => Boolean(id));

  const idLists = await Promise.all(
    uploadPlaylists.map((playlistId) =>
    fetchPlaylistVideoIds(playlistId, perChannel).catch(() => [] as string[])
    )
  );

  const videos = await hydrateVideoIds(idLists.flat());
  const avatarByChannel = new Map(
    subscriptions.map((item) => [item.channelId, item.avatar ?? ''])
  );

  return videos.
  map((video) => ({
    ...video,
    channelAvatar: avatarByChannel.get(video.channelId) || video.channelAvatar
  })).
  sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}