import type { Video } from '../types/youtube';
import { topicKeywords, type TasteSignals } from './recommendations';
import { fetchChannelProfile, fetchPlaylistVideos, searchVideos } from './youtubeApi';

/**
 * YouTube builds "Mix" playlists from what you watch. The Data API exposes no
 * mixes at all (radio playlist ids like RD… are not readable), so the clone
 * generates its own from the viewer's signals once there is something to work
 * with — two watched videos are enough.
 */
export interface MixDefinition {
  id: string;
  title: string;
  subtitle: string;
  thumbnail?: string;
}

const MIN_HISTORY_FOR_MIXES = 2;

export function mixIdForChannel(channelId: string): string {
  return `mix:channel:${channelId}`;
}

export function mixIdForTopic(topic: string): string {
  return `mix:topic:${topic}`;
}

export function isMixId(id: string): boolean {
  return id.startsWith('mix:');
}

export function buildMixes(signals: TasteSignals, limit = 6): MixDefinition[] {
  const watched = signals.history;
  if (watched.length < MIN_HISTORY_FOR_MIXES) return [];

  const mixes: MixDefinition[] = [];
  const seen = new Set<string>();

  // One mix per recently watched channel, newest first.
  for (const entry of watched) {
    const { channelId, channelTitle, thumbnail } = entry.video;
    if (!channelId || seen.has(channelId)) continue;
    seen.add(channelId);
    mixes.push({
      id: mixIdForChannel(channelId),
      title: `Mix — ${channelTitle}`,
      subtitle: `${channelTitle} and more`,
      thumbnail
    });
    if (mixes.length >= limit - 2) break;
  }

  // Plus a couple of topic mixes from likes and watch history.
  topicKeywords(signals, 2).forEach((topic) => {
    mixes.push({
      id: mixIdForTopic(topic),
      title: `${topic.charAt(0).toUpperCase()}${topic.slice(1)} mix`,
      subtitle: 'Built from what you watch',
      thumbnail: watched.find((entry) => entry.video.title.toLowerCase().includes(topic))?.video.
      thumbnail
    });
  });

  return mixes.slice(0, limit);
}

export interface LoadedMix {
  id: string;
  title: string;
  subtitle: string;
  videos: Video[];
}

/** Resolves a generated mix id into a real, playable list of videos. */
export async function loadMix(mixId: string, signals: TasteSignals): Promise<LoadedMix> {
  const [, kind, ...rest] = mixId.split(':');
  const seed = rest.join(':');

  if (kind === 'channel') {
    const [profile, watchedFromChannel] = await Promise.all([
    fetchChannelProfile(seed).catch(() => undefined),
    Promise.resolve(
      signals.history.filter((entry) => entry.video.channelId === seed).map((entry) => entry.video)
    )]
    );

    const uploads = profile?.uploadsPlaylistId ?
    await fetchPlaylistVideos(profile.uploadsPlaylistId, 24).catch(() => [] as Video[]) :
    [];

    const byId = new Map<string, Video>();
    [...watchedFromChannel, ...uploads].forEach((video) => byId.set(video.id, video));

    const related =
    byId.size < 10 ?
    await searchVideos(profile?.title ?? seed, 12).catch(() => [] as Video[]) :
    [];
    related.forEach((video) => byId.set(video.id, video));

    return {
      id: mixId,
      title: `Mix — ${profile?.title ?? 'Channel'}`,
      subtitle: 'Mixes are playlists the clone builds for you',
      videos: Array.from(byId.values()).slice(0, 25)
    };
  }

  const videos = await searchVideos(seed, 25);
  return {
    id: mixId,
    title: `${seed.charAt(0).toUpperCase()}${seed.slice(1)} mix`,
    subtitle: 'Mixes are playlists the clone builds for you',
    videos
  };
}