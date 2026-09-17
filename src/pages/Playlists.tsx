import React, { useMemo } from 'react';
import { ReconnectPrompt } from '../components/layout/ReconnectPrompt';
import { SignInPrompt } from '../components/layout/SignInPrompt';
import { PlaylistCard } from '../components/video/PlaylistCard';
import { VIDEO_GRID_CLASS } from '../components/video/VideoGrid';
import { useAuth } from '../contexts/AuthContext';
import { useLibrary } from '../contexts/LibraryContext';
import {
  needsReconnect,
  useLikedVideos,
  useMyPlaylists,
  useTasteSignals } from
'../hooks/useMyYouTube';
import type { PlaylistSummary } from '../types/youtube';
import { buildMixes } from '../utils/mixes';

export function Playlists() {
  const { youtubeLinked } = useAuth();
  const { playlists, loading, error } = useMyPlaylists();
  const { videos: liked, loading: likedLoading } = useLikedVideos(24);
  const { watchLater, playlists: localPlaylists } = useLibrary();
  const signals = useTasteSignals();

  const nativePlaylists = useMemo<PlaylistSummary[]>(
    () =>
    localPlaylists.map((playlist) => ({
      id: playlist.id,
      title: playlist.title,
      description: playlist.description,
      thumbnail: playlist.videos[0]?.thumbnail ?? '',
      itemCount: playlist.videos.length,
      channelTitle: 'You',
      privacyStatus: playlist.privacyStatus
    })),
    [localPlaylists]
  );

  const mixes = useMemo<PlaylistSummary[]>(
    () =>
    buildMixes(signals, 6).map((mix) => ({
      id: mix.id,
      title: mix.title,
      description: '',
      thumbnail: mix.thumbnail ?? '',
      itemCount: 25,
      channelTitle: mix.subtitle
    })),
    [signals]
  );

  const systemPlaylists = useMemo<PlaylistSummary[]>(
    () => [
    {
      id: 'WL',
      title: 'Watch later',
      description: '',
      thumbnail: watchLater[0]?.thumbnail ?? '',
      itemCount: watchLater.length,
      channelTitle: 'You',
      privacyStatus: 'private'
    },
    {
      id: 'LL',
      title: 'Liked videos',
      description: '',
      thumbnail: liked[0]?.thumbnail ?? '',
      itemCount: liked.length,
      channelTitle: 'You',
      privacyStatus: 'private'
    }],

    [watchLater, liked]
  );

  // Playlists created here work without the YouTube scope, so only prompt when
  // there is genuinely nothing to show.
  if (!youtubeLinked && nativePlaylists.length === 0 && watchLater.length === 0) {
    return (
      <SignInPrompt
        title="Your playlists live here"
        description="Sign in to see the playlists saved on your YouTube account, or save a video to start one here." />);


  }

  return (
    <div className="px-4 pb-16 pt-6 sm:px-6">
      <h1 className="mb-6 text-[24px] font-bold leading-8 text-yt-text">Playlists</h1>

      {needsReconnect(error) && <ReconnectPrompt />}

      <div className={VIDEO_GRID_CLASS}>
        {systemPlaylists.map((playlist) =>
        <PlaylistCard
          key={playlist.id}
          playlist={playlist}
          to={playlist.id === 'WL' ? '/feed/watch-later' : '/feed/liked'} />

        )}

        {(loading || likedLoading) &&
        Array.from({ length: 4 }).map((_, index) =>
        <div key={index} className="animate-pulse">
              <div className="aspect-video w-full rounded-xl bg-yt-skeleton" />
              <div className="mt-3 h-[14px] w-3/4 rounded bg-yt-skeleton" />
              <div className="mt-2 h-[12px] w-1/3 rounded bg-yt-skeleton" />
            </div>
        )}

        {nativePlaylists.map((playlist) =>
        <PlaylistCard key={playlist.id} playlist={playlist} />
        )}

        {playlists.map((playlist) =>
        <PlaylistCard key={playlist.id} playlist={playlist} />
        )}
      </div>

      {mixes.length > 0 &&
      <section className="mt-10">
          <h2 className="mb-4 text-[20px] font-bold leading-7 text-yt-text">Mixes for you</h2>
          <p className="mb-4 max-w-[640px] text-[13px] leading-[18px] text-yt-sub">
            YouTube's own mixes are not exposed by the API, so these are generated from your
            subscriptions, likes and what you watch here.
          </p>
          <div className={VIDEO_GRID_CLASS}>
            {mixes.map((mix) =>
          <PlaylistCard key={mix.id} playlist={mix} />
          )}
          </div>
        </section>
      }

      {!loading && playlists.length === 0 && nativePlaylists.length === 0 && !needsReconnect(error) &&
      <p className="mt-10 text-[14px] leading-5 text-yt-sub">
          You haven't created any playlists on YouTube yet — only the lists above are available
          through the API.
        </p>
      }
    </div>);

}