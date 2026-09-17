import type { HistoryEntry, SubscriptionItem, Video } from '../types/youtube';
import { durationToSeconds } from './format';

export interface TasteSignals {
  subscriptions: SubscriptionItem[];
  liked: Video[];
  history: HistoryEntry[];
  /** Seconds actually watched per video — the strongest engagement signal. */
  watchSeconds?: Record<string, number>;
  /** Channels the viewer asked not to be recommended. */
  mutedChannels?: string[];
  dislikes?: string[];
}

export type FeedSource = 'subscription' | 'taste' | 'trending';

export interface SourcedVideos {
  subscription: Video[];
  taste: Video[];
  trending: Video[];
}

const SOURCE_WEIGHT: Record<FeedSource, number> = {
  subscription: 1,
  taste: 0.92,
  trending: 0.58
};

const STOP_WORDS = new Set([
'the', 'and', 'for', 'with', 'from', 'that', 'this', 'you', 'your', 'are', 'was', 'they', 'their', 'what', 'when',
'how', 'why', 'all', 'not', 'but', 'out', 'new', 'official', 'video', 'full', 'feat', 'les', 'des', 'une', 'un',
'pour', 'avec', 'sur', 'dans', 'par', 'que', 'qui', 'quoi', 'est', 'sont', 'mix', 'episode', 'part', 'live', 'clip',
'music', 'lyrics', 'audio', 'ce', 'se', 'sa', 'ses', 'mon', 'mes', 'nous', 'vous', 'ils', 'elles', 'plus', 'tout',
'tous', 'toute', 'tres', 'bien', 'fait', 'faire', 'comme', 'mais', 'donc', 'chez', 'sans', 'elle', 'dont']
);

function tokenize(text: string): string[] {
  return text.
  toLowerCase().
  normalize('NFD').
  replace(/[\u0300-\u036f]/g, '').
  replace(/[^a-z0-9\s]/g, ' ').
  split(/\s+/).
  filter((token) => token.length > 3 && !STOP_WORDS.has(token));
}

/** Stable 32-bit hash — used for deterministic tie-breaking, never Math.random. */
function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0) / 4294967295;
}

/**
 * How much the viewer engages with each channel, normalised to 0 → 1.
 *
 * Repeat listening matters more than a single visit, so the same channel
 * appearing several times in history compounds, and minutes actually watched
 * weigh more than an opened-and-abandoned video.
 */
export function channelAffinity(signals: TasteSignals): Map<string, number> {
  const scores = new Map<string, number>();
  const bump = (channelId: string, amount: number) => {
    if (!channelId) return;
    scores.set(channelId, (scores.get(channelId) ?? 0) + amount);
  };

  const now = Date.now();
  const watchSeconds = signals.watchSeconds ?? {};

  // Subscribing is a weak signal on its own: people subscribe for a single
  // video and never come back, and a 1,500-subscription account would drown
  // the feed. A subscription only counts once the viewer has actually watched
  // that channel — then it counts for a lot, because it is corroborated.
  const watchedChannels = new Set(signals.history.map((entry) => entry.video.channelId));
  signals.subscriptions.forEach((item) => {
    if (watchedChannels.has(item.channelId)) bump(item.channelId, 0.7);
  });

  signals.liked.forEach((video) => bump(video.channelId, 0.9));
  signals.history.forEach((entry) => {
    const ageDays = (now - entry.watchedAt) / 86_400_000;
    const recency = Math.max(0.15, 1.2 - ageDays * 0.05);
    // Up to +0.6 for a video watched 10 minutes or more.
    const engagement = Math.min(0.6, (watchSeconds[entry.video.id] ?? 0) / 600);
    bump(entry.video.channelId, recency + engagement);
  });

  signals.mutedChannels?.forEach((channelId) => scores.set(channelId, -1));

  const max = Math.max(1, ...Array.from(scores.values()));
  scores.forEach((value, key) => scores.set(key, value / max));
  return scores;
}

export interface TasteTopic {
  keyword: string;
  /** Fraction of the viewer's overall taste this topic represents (0 → 1). */
  share: number;
}

/**
 * The viewer's taste as a *distribution*, not a ranking.
 *
 * If a third of what they save is psytrance, psytrance should take roughly a
 * third of the personalised slots — that proportionality is what stops the feed
 * from collapsing onto one artist. Recent listening is weighted about twice as
 * heavily as older listening, so the distribution drifts as habits change
 * instead of switching wholesale.
 */
export function tasteProfile(signals: TasteSignals, limit = 6): TasteTopic[] {
  const weights = new Map<string, number>();
  const sessions = new Map<string, Set<number>>();
  const now = Date.now();
  const watchSeconds = signals.watchSeconds ?? {};

  const add = (text: string, weight: number, day?: number) => {
    tokenize(text).forEach((token) => {
      weights.set(token, (weights.get(token) ?? 0) + weight);
      if (day === undefined) return;
      const days = sessions.get(token) ?? new Set<number>();
      days.add(day);
      sessions.set(token, days);
    });
  };

  signals.liked.forEach((video) => add(video.title, 1.2));

  // Same rule as channel affinity: an un-listened subscription contributes
  // nothing to the taste distribution.
  const watchedChannels = new Set(signals.history.map((entry) => entry.video.channelId));
  signals.subscriptions.forEach((item) => {
    if (watchedChannels.has(item.channelId)) add(item.title, 0.5);
  });

  signals.history.forEach((entry) => {
    const ageDays = (now - entry.watchedAt) / 86_400_000;
    // Anything from the last week counts double: that is the drift.
    const recency = ageDays < 7 ? 2 : Math.max(0.3, 1.4 - ageDays * 0.06);
    const engagement = 1 + Math.min(1, (watchSeconds[entry.video.id] ?? 0) / 480);
    add(entry.video.title, recency * engagement, Math.floor(entry.watchedAt / 86_400_000));
  });

  const scored = Array.from(weights.entries()).
  map(([keyword, weight]) => {
    // A token seen across several days is a genuine taste, not an accident.
    const spread = sessions.get(keyword)?.size ?? 1;
    return { keyword, weight: weight * (1 + Math.log2(spread) * 0.5) };
  }).
  sort((a, b) => b.weight - a.weight).
  slice(0, limit);

  const total = scored.reduce((sum, item) => sum + item.weight, 0);
  if (total === 0) return [];
  return scored.map((item) => ({ keyword: item.keyword, share: item.weight / total }));
}

/**
 * Index of the current rotation window.
 *
 * The feed must not reshuffle on every reload, but it must not be frozen
 * either. Ordering is deterministic *within* a window and changes when the
 * window turns over, so refreshing twice in a row is stable while coming back
 * later brings new faces — without spending any extra API quota, because the
 * candidate pool is still served from cache.
 */
export function rotationSlot(minutes = 15): number {
  return Math.floor(Date.now() / (minutes * 60_000));
}

/**
 * Weighted keywords extracted from what the viewer likes and watches. Tokens
 * that recur across several sessions outrank a one-off binge, which is how a
 * day of scattered listening still resolves into a coherent evening mix.
 */
export function topicKeywords(signals: TasteSignals, limit = 8): string[] {
  const weights = new Map<string, number>();
  const sessions = new Map<string, Set<number>>();

  const add = (text: string, weight: number, day?: number) => {
    tokenize(text).forEach((token) => {
      weights.set(token, (weights.get(token) ?? 0) + weight);
      if (day === undefined) return;
      const days = sessions.get(token) ?? new Set<number>();
      days.add(day);
      sessions.set(token, days);
    });
  };

  signals.liked.forEach((video) => add(video.title, 1.2));

  const now = Date.now();
  const watchSeconds = signals.watchSeconds ?? {};
  signals.history.forEach((entry) => {
    const ageDays = (now - entry.watchedAt) / 86_400_000;
    const engagement = 1 + Math.min(1, (watchSeconds[entry.video.id] ?? 0) / 480);
    add(
      entry.video.title,
      Math.max(0.3, 1.4 - ageDays * 0.08) * engagement,
      Math.floor(entry.watchedAt / 86_400_000)
    );
  });

  signals.subscriptions.forEach((item) => add(item.title, 0.4));

  return Array.from(weights.entries()).
  map(([token, weight]) => {
    // A token seen across multiple days is a genuine taste, not an accident.
    const spread = sessions.get(token)?.size ?? 1;
    return [token, weight * (1 + Math.log2(spread) * 0.5)] as const;
  }).
  sort((a, b) => b[1] - a[1]).
  slice(0, limit).
  map(([token]) => token);
}

function freshnessScore(publishedAt: string): number {
  if (!publishedAt) return 0.2;
  const ageHours = (Date.now() - new Date(publishedAt).getTime()) / 3_600_000;
  if (Number.isNaN(ageHours)) return 0.2;
  if (ageHours < 24) return 1;
  if (ageHours < 72) return 0.85;
  if (ageHours < 24 * 7) return 0.7;
  if (ageHours < 24 * 30) return 0.5;
  if (ageHours < 24 * 365) return 0.32;
  return 0.2;
}

function popularityScore(views?: number): number {
  if (!views || views <= 0) return 0;
  return Math.min(1, Math.log10(views) / 8);
}

interface ScoredVideo {
  video: Video;
  source: FeedSource;
  score: number;
}

function scoreVideo(
video: Video,
source: FeedSource,
affinity: Map<string, number>,
topics: TasteTopic[],
watched: Set<string>,
slot: number)
: number {
  const titleTokens = new Set(tokenize(video.title));
  // Proportional, not binary: matching the topic that makes up 30% of the
  // viewer's taste counts for far more than matching a 5% one.
  const matched = topics.
  filter((topic) => titleTokens.has(topic.keyword)).
  reduce((sum, topic) => sum + topic.share, 0);
  const topicScore = Math.min(1, matched * 2.2);

  const score =
  SOURCE_WEIGHT[source] * (
  0.28 * freshnessScore(video.publishedAt) +
  0.27 * Math.max(0, affinity.get(video.channelId) ?? 0) +
  0.27 * topicScore +
  0.12 * popularityScore(video.views) +
  // Rotation jitter: deterministic inside a window, different in the next
  // one. Enough to reshuffle the surface, too small to override taste.
  0.06 * hash(`${video.id}:${slot}`));

  return watched.has(video.id) ? score * 0.22 : score;
}

/**
 * Blends the viewer's subscriptions, taste-based results and trending into one
 * ranked feed: no channel twice in a row, at most two videos per channel, and
 * a fixed source mix so the page never looks like a single-channel dump.
 * Muted channels and disliked videos are dropped outright.
 */
export function assembleHomeFeed(
sources: SourcedVideos,
signals: TasteSignals,
targetLength = 32,
slot = rotationSlot())
: Video[] {
  const affinity = channelAffinity(signals);
  const topics = tasteProfile(signals, 8);
  const watched = new Set(signals.history.map((entry) => entry.video.id));
  const muted = new Set(signals.mutedChannels ?? []);
  const disliked = new Set(signals.dislikes ?? []);

  const pool = new Map<string, ScoredVideo>();
  const consider = (videos: Video[], source: FeedSource) => {
    videos.forEach((video) => {
      if (!video.id || pool.has(video.id)) return;
      if (muted.has(video.channelId) || disliked.has(video.id)) return;
      pool.set(video.id, {
        video,
        source,
        score: scoreVideo(video, source, affinity, topics, watched, slot)
      });
    });
  };

  consider(sources.subscription, 'subscription');
  consider(sources.taste, 'taste');
  consider(sources.trending, 'trending');

  const bySource: Record<FeedSource, ScoredVideo[]> = {
    subscription: [],
    taste: [],
    trending: []
  };
  Array.from(pool.values()).
  sort((a, b) => b.score - a.score || (a.video.id < b.video.id ? -1 : 1)).
  forEach((item) => bySource[item.source].push(item));

  const quotas: Array<[FeedSource, number]> = [
  ['subscription', Math.round(targetLength * 0.45)],
  ['taste', Math.round(targetLength * 0.3)],
  ['trending', targetLength]];


  const feed: Video[] = [];
  const perChannel = new Map<string, number>();
  let lastChannel = '';

  const tryTake = (source: FeedSource, allowSameChannel: boolean): boolean => {
    const queue = bySource[source];
    for (let index = 0; index < queue.length; index += 1) {
      const candidate = queue[index];
      const channelId = candidate.video.channelId;
      const used = perChannel.get(channelId) ?? 0;
      if (used >= 2) continue;
      if (!allowSameChannel && channelId && channelId === lastChannel) continue;
      queue.splice(index, 1);
      feed.push(candidate.video);
      perChannel.set(channelId, used + 1);
      lastChannel = channelId;
      return true;
    }
    return false;
  };

  for (const [source, quota] of quotas) {
    let taken = 0;
    while (taken < quota && feed.length < targetLength) {
      if (tryTake(source, false) || tryTake(source, true)) taken += 1;else
      break;
    }
  }

  const order: FeedSource[] = ['subscription', 'taste', 'trending'];
  let progressed = true;
  while (feed.length < targetLength && progressed) {
    progressed = false;
    for (const source of order) {
      if (feed.length >= targetLength) break;
      if (tryTake(source, false) || tryTake(source, true)) progressed = true;
    }
  }

  return feed;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Topic chips derived from the viewer's own signals, the way YouTube surfaces
 * personal topics instead of a fixed list.
 */
export function buildDynamicChips(
signals: TasteSignals,
feed: Video[],
fallback: string[])
: string[] {
  const affinity = channelAffinity(signals);
  const topChannels = Array.from(affinity.entries()).
  filter(([, score]) => score > 0).
  sort((a, b) => b[1] - a[1]).
  slice(0, 3).
  map(([channelId]) => {
    const subscription = signals.subscriptions.find((item) => item.channelId === channelId);
    if (subscription) return subscription.title;
    const liked = signals.liked.find((video) => video.channelId === channelId);
    if (liked) return liked.channelTitle;
    const watched = signals.history.find((entry) => entry.video.channelId === channelId);
    return watched?.video.channelTitle ?? '';
  }).
  filter(Boolean);

  const keywords = topicKeywords(signals, 6).map(titleCase);

  const feedChannels = Array.from(new Set(feed.slice(0, 12).map((video) => video.channelTitle))).
  filter(Boolean).
  slice(0, 2);

  const chips = [
  'All',
  ...keywords,
  ...topChannels,
  ...feedChannels,
  'Live',
  'Mixes',
  'Recently uploaded',
  'New to you'];


  const seen = new Set<string>();
  const unique = chips.filter((chip) => {
    const key = chip.toLowerCase();
    if (!chip || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.length > 4 ? unique.slice(0, 16) : fallback;
}

/**
 * Filters used by the watch page's "next" rail. They are derived from what the
 * related videos actually contain, so an empty bucket never gets a chip.
 */
export interface RelatedFilter {
  label: string;
  predicate: (video: Video) => boolean;
}

export function buildRelatedFilters(
current: Video | undefined,
related: Video[],
signals: TasteSignals)
: RelatedFilter[] {
  if (!current || related.length === 0) return [];

  const watched = new Set(signals.history.map((entry) => entry.video.id));
  const subscribed = new Set(signals.subscriptions.map((item) => item.channelId));
  const keywords = topicKeywords(signals, 4);

  const candidates: RelatedFilter[] = [
  { label: 'All', predicate: () => true },
  {
    label: `From ${current.channelTitle}`,
    predicate: (video) => video.channelId === current.channelId
  },
  {
    label: 'From your channels',
    predicate: (video) => subscribed.has(video.channelId)
  },
  {
    label: 'Recently uploaded',
    predicate: (video) => freshnessScore(video.publishedAt) >= 0.85
  },
  {
    label: 'Watched',
    predicate: (video) => watched.has(video.id)
  },
  {
    label: 'Unwatched',
    predicate: (video) => !watched.has(video.id)
  },
  {
    label: 'Live now',
    predicate: (video) => Boolean(video.isLive)
  }];


  // Duration buckets: the rail mixes clips and long-form, and length is the
  // distinction viewers reach for most after topic.
  candidates.push(
    {
      label: 'Under 4 minutes',
      predicate: (video) => {
        const seconds = durationToSeconds(video.duration);
        return seconds > 0 && seconds < 240;
      }
    },
    {
      label: 'Over 20 minutes',
      predicate: (video) => durationToSeconds(video.duration) > 1200
    },
    {
      label: 'Popular',
      predicate: (video) => video.views >= 1_000_000
    }
  );

  keywords.slice(0, 5).forEach((keyword) => {
    candidates.push({
      label: titleCase(keyword),
      predicate: (video) => tokenize(video.title).includes(keyword)
    });
  });

  // The channels that actually recur in THIS rail. These are the chips YouTube
  // surfaces most, and they are the reason the row is worth scrolling.
  const byChannel = new Map<string, {title: string;count: number;}>();
  related.forEach((video) => {
    if (!video.channelId || video.channelId === current.channelId) return;
    const entry = byChannel.get(video.channelId) ?? { title: video.channelTitle, count: 0 };
    entry.count += 1;
    byChannel.set(video.channelId, entry);
  });

  Array.from(byChannel.entries()).
  filter(([, entry]) => entry.count >= 2).
  sort((a, b) => b[1].count - a[1].count).
  slice(0, 6).
  forEach(([channelId, entry]) => {
    candidates.push({
      label: entry.title,
      predicate: (video) => video.channelId === channelId
    });
  });

  // Only keep filters that would actually return something, and never repeat a
  // label — a channel name can collide with a topic keyword.
  const seen = new Set<string>();
  return candidates.filter((filter) => {
    if (seen.has(filter.label)) return false;
    seen.add(filter.label);
    if (filter.label === 'All') return true;
    return related.filter((video) => filter.predicate(video)).length >= 2;
  });
}