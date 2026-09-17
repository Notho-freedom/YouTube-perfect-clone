import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SearchIcon, XIcon } from 'lucide-react';
import { PlaylistCard } from '../components/video/PlaylistCard';
import { ChannelAvatar } from '../components/video/ChannelAvatar';
import { VideoGrid, VIDEO_GRID_CLASS } from '../components/video/VideoGrid';
import { ShortsShelf } from '../components/shorts/ShortsShelf';
import { useLibrary } from '../contexts/LibraryContext';
import {
  useChannelPlaylists,
  useChannelProfile,
  useChannelShorts,
  useChannelVideos } from
'../hooks/useChannel';
import { compact, compactPrecise } from '../utils/format';
import { FeedPlaceholder } from './FeedPlaceholder';

const TABS = ['Home', 'Videos', 'Shorts', 'Playlists', 'About'] as const;
type Tab = (typeof TABS)[number];

export function Channel() {
  const { channelId = '' } = useParams();
  const [tab, setTab] = useState<Tab>('Home');
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [channelQuery, setChannelQuery] = useState('');
  const { toggleSubscription, isSubscribed } = useLibrary();
  const subscribed = isSubscribed(channelId);

  const { channel, loading, error } = useChannelProfile(channelId);
  const { videos: allVideos, loading: videosLoading } = useChannelVideos(
    channel?.uploadsPlaylistId
  );

  // Channel search narrows what was already fetched — the API has no
  // "search within a channel's uploads" endpoint that doesn't cost 100 units.
  const videos = useMemo(() => {
    const needle = channelQuery.trim().toLowerCase();
    if (!needle) return allVideos;
    return allVideos.filter((video) => video.title.toLowerCase().includes(needle));
  }, [allVideos, channelQuery]);
  const { shorts, loading: shortsLoading } = useChannelShorts(
    channelId,
    tab === 'Shorts' || tab === 'Home'
  );
  const { playlists, loading: playlistsLoading } = useChannelPlaylists(
    channelId,
    tab === 'Playlists' || tab === 'Home'
  );

  if (error) {
    return (
      <FeedPlaceholder
        title="This channel isn't available"
        description="The channel could not be loaded. It may have been removed, or the API quota is exhausted." />);


  }

  const meta = [
  channel?.handle,
  channel?.subscribers !== undefined && `${compactPrecise(channel.subscribers)} subscribers`,
  channel?.videoCount !== undefined && `${compact(channel.videoCount)} videos`].

  filter(Boolean).
  join(' • ');

  return (
    <div className="pb-16">
      <div className="mx-auto max-w-[1284px] px-4 pt-4 sm:px-6">
        {loading ?
        <div className="aspect-[6.2/1] w-full animate-pulse rounded-xl bg-yt-skeleton" /> :

        channel?.banner &&
        <div className="aspect-[6.2/1] w-full overflow-hidden rounded-xl bg-yt-skeleton">
              <img src={channel.banner} alt="" className="h-full w-full object-cover" />
            </div>

        }

        <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          {loading ?
          <div className="h-[128px] w-[128px] shrink-0 animate-pulse rounded-full bg-yt-skeleton" /> :

          <ChannelAvatar name={channel?.title ?? ''} src={channel?.avatar} size={128} />
          }

          <div className="min-w-0 flex-1">
            <h1 className="text-[24px] font-bold leading-8 text-yt-text sm:text-[36px] sm:leading-[44px]">
              {channel?.title ?? ' '}
            </h1>
            {meta && <p className="mt-1 text-[14px] leading-5 text-yt-sub">{meta}</p>}
            {channel?.description &&
            <button
              type="button"
              onClick={() => setDescriptionOpen((value) => !value)}
              className="mt-1 max-w-[560px] text-left text-[14px] leading-5 text-yt-sub">
              
                <span className={descriptionOpen ? 'whitespace-pre-line' : 'line-clamp-1'}>
                  {channel.description}
                </span>
                <span className="font-medium text-yt-text">
                  {descriptionOpen ? ' Show less' : ' ...more'}
                </span>
              </button>
            }

            <button
              type="button"
              onClick={() =>
              toggleSubscription({
                channelId,
                title: channel?.title ?? '',
                avatar: channel?.avatar
              })
              }
              className={
              subscribed ?
              'mt-4 flex h-9 items-center rounded-full bg-yt-chip px-4 text-[14px] font-medium leading-none text-yt-text transition-colors duration-150 hover:bg-yt-chipHover' :
              'mt-4 flex h-9 items-center rounded-full bg-yt-inverse px-4 text-[14px] font-medium leading-none text-yt-inverseText transition-opacity duration-150 hover:opacity-90'
              }>
              
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>
        </header>

        <nav className="no-scrollbar mt-6 flex items-center gap-8 overflow-x-auto border-b border-yt-border">
          {TABS.map((item) =>
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            aria-current={tab === item ? 'page' : undefined}
            className={`relative shrink-0 pb-3 text-[16px] font-medium leading-none transition-colors duration-150 ${
            tab === item ? 'text-yt-text' : 'text-yt-sub hover:text-yt-text'}`
            }>
            
              {item}
              {tab === item &&
            <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-yt-text" />
            }
            </button>
          )}
          <div className="ml-auto mb-2 flex shrink-0 items-center">
            {searchOpen ?
            <div className="flex h-9 items-center gap-2 border-b border-yt-text px-2">
                <SearchIcon className="h-5 w-5 shrink-0 text-yt-sub" strokeWidth={1.8} />
                <input
                autoFocus
                value={channelQuery}
                onChange={(event) => setChannelQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setChannelQuery('');
                    setSearchOpen(false);
                  }
                }}
                type="text"
                placeholder="Search"
                aria-label="Search this channel"
                className="h-full w-[180px] bg-transparent text-[14px] text-yt-text outline-none placeholder:text-yt-sub" />
              
                <button
                type="button"
                onClick={() => {
                  setChannelQuery('');
                  setSearchOpen(false);
                }}
                aria-label="Close channel search"
                className="flex h-7 w-7 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
                
                  <XIcon className="h-4 w-4" strokeWidth={2} />
                </button>
              </div> :

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search this channel"
              className="flex h-9 w-9 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
              
                <SearchIcon className="h-5 w-5" strokeWidth={1.8} />
              </button>
            }
          </div>
        </nav>
      </div>

      <div className="mx-auto max-w-[1284px] px-4 pt-6 sm:px-6">
        {tab === 'Home' &&
        <>
            <section className="mb-8">
              <h2 className="mb-4 text-[20px] font-bold leading-7 text-yt-text">Latest uploads</h2>
              <VideoGrid
              videos={videos.slice(0, 8)}
              loading={videosLoading}
              skeletonCount={8}
              emptyMessage="This channel has no public uploads." />
            
            </section>

            {shorts.length > 0 && !shortsLoading &&
          <div className="mb-8">
                <ShortsShelf shorts={shorts} />
              </div>
          }

            {playlists.length > 0 && !playlistsLoading &&
          <section>
                <h2 className="mb-4 text-[20px] font-bold leading-7 text-yt-text">Playlists</h2>
                <div className="no-scrollbar -mx-2 flex gap-2 overflow-x-auto px-2 pb-1">
                  {playlists.slice(0, 8).map((playlist) =>
              <div key={playlist.id} className="w-[280px] shrink-0">
                      <PlaylistCard playlist={playlist} />
                    </div>
              )}
                </div>
              </section>
          }
          </>
        }

        {tab === 'Videos' &&
        <VideoGrid
          videos={videos}
          loading={videosLoading}
          emptyMessage={
          channelQuery.trim() ?
          `No uploads match “${channelQuery.trim()}”.` :
          'This channel has no public uploads.'
          } />

        }

        {tab === 'Shorts' &&
        <VideoGrid
          videos={shorts}
          loading={shortsLoading}
          emptyMessage="This channel has no Shorts." />

        }

        {tab === 'Playlists' &&
        <div className={VIDEO_GRID_CLASS}>
            {playlistsLoading ?
          Array.from({ length: 8 }).map((_, index) =>
          <div key={index} className="animate-pulse">
                    <div className="aspect-video w-full rounded-xl bg-yt-skeleton" />
                    <div className="mt-3 h-[14px] w-3/4 rounded bg-yt-skeleton" />
                  </div>
          ) :
          playlists.map((playlist) =>
          <PlaylistCard key={playlist.id} playlist={playlist} />
          )}
          </div>
        }

        {tab === 'About' &&
        <section className="max-w-[720px]">
            <h2 className="mb-3 text-[20px] font-bold leading-7 text-yt-text">About</h2>
            <p className="whitespace-pre-line text-[14px] leading-5 text-yt-text">
              {channel?.description || 'This channel has no description.'}
            </p>
            <dl className="mt-6 space-y-2 text-[14px] leading-5 text-yt-sub">
              {channel?.subscribers !== undefined &&
            <div className="flex gap-2">
                  <dt>Subscribers</dt>
                  <dd className="text-yt-text">{compactPrecise(channel.subscribers)}</dd>
                </div>
            }
              {channel?.totalViews !== undefined &&
            <div className="flex gap-2">
                  <dt>Total views</dt>
                  <dd className="text-yt-text">{compact(channel.totalViews)}</dd>
                </div>
            }
              {channel?.videoCount !== undefined &&
            <div className="flex gap-2">
                  <dt>Videos</dt>
                  <dd className="text-yt-text">{compact(channel.videoCount)}</dd>
                </div>
            }
              {channel?.publishedAt &&
            <div className="flex gap-2">
                  <dt>Joined</dt>
                  <dd className="text-yt-text">
                    {new Date(channel.publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
                  </dd>
                </div>
            }
            </dl>
          </section>
        }
      </div>
    </div>);

}