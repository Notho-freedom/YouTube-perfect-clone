import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';
import { ReconnectPrompt } from '../components/layout/ReconnectPrompt';
import { SignInPrompt } from '../components/layout/SignInPrompt';
import { ChannelAvatar } from '../components/video/ChannelAvatar';
import { PlaylistCard } from '../components/video/PlaylistCard';
import { VideoShelf } from '../components/video/VideoShelf';
import { useAuth } from '../contexts/AuthContext';
import {
  needsReconnect,
  useLikedVideos,
  useMyChannel,
  useMyPlaylists,
  useMyUploads } from
'../hooks/useMyYouTube';
import { compactPrecise } from '../utils/format';

export function You() {
  const { youtubeLinked, user } = useAuth();
  const { channel, loading: channelLoading, error: channelError } = useMyChannel();
  const { playlists, loading: playlistsLoading } = useMyPlaylists();
  const { videos: liked, loading: likedLoading } = useLikedVideos(10);
  const { videos: uploads, loading: uploadsLoading } = useMyUploads(channel?.uploadsPlaylistId);

  if (!youtubeLinked) {
    return (
      <SignInPrompt
        title="Your YouTube account"
        description="Sign in with Google to load your channel, subscriptions, playlists and liked videos." />);


  }

  const name =
  channel?.title ?? user?.user_metadata?.full_name as string | undefined ?? user?.email ?? 'You';
  const avatar = channel?.avatar ?? user?.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="px-4 pb-16 pt-6 sm:px-6">
      {needsReconnect(channelError) && <ReconnectPrompt />}

      <header className="flex items-center gap-4">
        {channelLoading ?
        <div className="h-20 w-20 animate-pulse rounded-full bg-yt-skeleton" /> :

        <ChannelAvatar name={name} src={avatar} size={80} />
        }
        <div className="min-w-0">
          <h1 className="truncate text-[24px] font-bold leading-8 text-yt-text">{name}</h1>
          <p className="mt-1 text-[12px] leading-[18px] text-yt-sub">
            {[
            channel?.handle,
            channel?.subscribers !== undefined &&
            `${compactPrecise(channel.subscribers)} subscribers`,
            channel?.videoCount !== undefined && `${channel.videoCount} videos`].

            filter(Boolean).
            join(' • ')}
          </p>
        </div>
      </header>

      <div className="mt-8">
        <VideoShelf
          title="Liked videos"
          videos={liked}
          loading={likedLoading}
          to="/feed/liked"
          emptyMessage="You haven't liked any videos." />
        

        <section className="mt-8">
          <header className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-[20px] font-bold leading-7 text-yt-text">Playlists</h2>
            {playlists.length > 0 &&
            <Link
              to="/feed/playlists"
              className="flex h-8 items-center gap-1 rounded-full px-3 text-[14px] font-medium leading-none text-yt-text transition-colors duration-150 hover:bg-yt-hover">
              
                View all
                <ChevronRightIcon className="h-4 w-4" strokeWidth={2} />
              </Link>
            }
          </header>

          {playlistsLoading ?
          <div className="no-scrollbar flex gap-4 overflow-x-auto">
              {Array.from({ length: 4 }).map((_, index) =>
            <div key={index} className="w-[280px] shrink-0 animate-pulse">
                  <div className="aspect-video w-full rounded-xl bg-yt-skeleton" />
                  <div className="mt-3 h-[14px] w-3/4 rounded bg-yt-skeleton" />
                </div>
            )}
            </div> :
          playlists.length === 0 ?
          <p className="text-[14px] leading-5 text-yt-sub">
              You don't have any playlists on YouTube yet.
            </p> :

          <div className="no-scrollbar -mx-2 flex gap-2 overflow-x-auto px-2 pb-1">
              {playlists.slice(0, 8).map((playlist) =>
            <div key={playlist.id} className="w-[280px] shrink-0">
                  <PlaylistCard playlist={playlist} />
                </div>
            )}
            </div>
          }
        </section>

        <VideoShelf
          title="Your videos"
          videos={uploads}
          loading={uploadsLoading}
          emptyMessage="You haven't uploaded any videos." />
        
      </div>
    </div>);

}