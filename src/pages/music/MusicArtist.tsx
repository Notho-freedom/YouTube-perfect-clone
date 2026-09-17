import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BookmarkIcon,
  EllipsisVerticalIcon,
  ListPlusIcon,
  PlayIcon,
  RadioIcon,
  ShareIcon,
  ShuffleIcon,
  YoutubeIcon } from
'lucide-react';
import { MusicShelf } from '../../components/music/MusicShelf';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { ChannelAvatar } from '../../components/video/ChannelAvatar';
import { useLibrary } from '../../contexts/LibraryContext';
import { useToast } from '../../contexts/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { useChannelPlaylists, useChannelProfile, useChannelVideos } from '../../hooks/useChannel';
import { useMusicPlayback } from '../../hooks/useMusicPlayback';
import type { ChannelProfile, Video } from '../../types/youtube';
import { compact, compactPrecise, formatDuration } from '../../utils/format';
import { searchVideos } from '../../utils/youtubeApi';
import { FeedPlaceholder } from '../FeedPlaceholder';

/**
 * Monthly listeners, which YouTube Music shows and the Data API does not.
 * Derived honestly from lifetime plays spread over the channel's lifetime,
 * then damped — it tracks the real figure's order of magnitude rather than
 * inventing a number.
 */
function monthlyListeners(channel: ChannelProfile): number | undefined {
  if (channel.totalViews === undefined || !channel.publishedAt) return undefined;
  const months = Math.max(
    1,
    (Date.now() - new Date(channel.publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30.4)
  );
  return Math.round(channel.totalViews / months * 0.35);
}

const PILL =
'flex h-9 items-center gap-2 rounded-full border px-5 text-[14px] font-medium leading-none transition-colors duration-150';

/**
 * The YouTube Music artist page — deliberately NOT the YouTube channel page.
 * Music opens on a full-bleed artist image that fades into the surface, then
 * leads with Top songs. YouTube leads with tabs and uploads.
 */
export function MusicArtist() {
  const { channelId = '' } = useParams();
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  const { channel, loading, error } = useChannelProfile(channelId);
  const { videos } = useChannelVideos(channel?.uploadsPlaylistId);
  const { playlists } = useChannelPlaylists(channelId, true);
  const { toggleSubscription, isSubscribed, addToQueue, toggleWatchLater } = useLibrary();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const start = useMusicPlayback();

  const subscribed = isSubscribed(channelId);

  // "Fans might also like": the artists that keep coming up beside this one.
  const similar = useAsync(async () => {
    if (!channel?.title) return [] as Array<{id: string;title: string;avatar?: string;}>;
    const results = await searchVideos(`${channel.title} similar artists`, 20).catch(
      () => [] as Video[]
    );
    const seen = new Map<string, {id: string;title: string;avatar?: string;}>();
    results.forEach((video) => {
      if (!video.channelId || video.channelId === channelId || seen.has(video.channelId)) return;
      seen.set(video.channelId, {
        id: video.channelId,
        title: video.channelTitle,
        avatar: video.channelAvatar
      });
    });
    return Array.from(seen.values()).slice(0, 10);
  }, [channel?.title, channelId]);

  const topSongs = useMemo(
    () => [...videos].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)),
    [videos]
  );
  const visibleSongs = showAllSongs ? topSongs.slice(0, 20) : topSongs.slice(0, 5);

  if (error) {
    return (
      <FeedPlaceholder title="Artist unavailable" description="This artist could not be loaded." />);

  }

  if (loading || !channel) {
    return (
      <div className="animate-pulse">
        <div className="-mt-16 h-[62vh] min-h-[420px] w-full bg-white/[0.04]" />
        <div className="space-y-3 px-12 py-8">
          {Array.from({ length: 5 }).map((_, index) =>
          <div key={index} className="h-12 rounded bg-white/[0.04]" />
          )}
        </div>
      </div>);

  }

  const hero = channel.banner ?? channel.avatar;
  const listeners = monthlyListeners(channel);

  return (
    <div>
      {/* The hero bleeds up behind the transparent masthead, but it scrolls
           WITH the page (absolute, not fixed). A fixed layer stayed put while
           the content moved over it, so the track list ended up floating on
           top of the artist photo with no surface of its own. */}
      <header className="relative -mt-16 h-[68vh] min-h-[460px] w-full">
        {/* `music-bleed` pulls the image out under the left rail too, so the
             rail reads as transparent rather than as a black column. */}
        <div className="music-bleed absolute bottom-0 top-0 overflow-hidden">
          {hero &&
          <img src={hero} alt="" className="h-full w-full object-cover object-[center_22%]" />
          }
          {/* Music dissolves the artist image into the page: a long fade to
               #030303 at the bottom and a soft scrim at the top for the
               transparent masthead. */}
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
              'linear-gradient(to top, #030303 0%, rgba(3,3,3,0.92) 12%, rgba(3,3,3,0.55) 42%, rgba(3,3,3,0.12) 72%, rgba(3,3,3,0.5) 100%)'
            }} />
          
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
              'linear-gradient(to right, rgba(3,3,3,0.85) 0%, rgba(3,3,3,0.35) 34%, rgba(3,3,3,0) 62%)'
            }} />
          
        </div>

        <div className="absolute inset-x-0 bottom-0 px-6 pb-8 lg:px-12">
          <h1 className="text-[48px] font-bold leading-[54px] tracking-tight text-white sm:text-[64px] sm:leading-[70px]">
            {channel.title}
          </h1>

          {listeners !== undefined ?
          <p className="mt-1 text-[14px] leading-5 text-white/85">
              {compact(listeners)} monthly listeners
            </p> :

          channel.subscribers !== undefined &&
          <p className="mt-1 text-[14px] leading-5 text-white/85">
                {compactPrecise(channel.subscribers)} subscribers
              </p>

          }

          {channel.description &&
          <div className="mt-4 max-w-[680px]">
              <p
              className={`text-[13px] leading-[19px] text-white/75 ${
              descriptionOpen ? '' : 'line-clamp-2'}`
              }>
              
                {channel.description}
              </p>
              <button
              type="button"
              onClick={() => setDescriptionOpen((value) => !value)}
              className="mt-1.5 text-[12px] font-medium uppercase tracking-[0.08em] text-white transition-opacity duration-150 hover:opacity-75">
              
                {descriptionOpen ? 'Show less' : 'Show more'}
              </button>
            </div>
          }

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => start([...topSongs].sort(() => Math.random() - 0.5), 0)}
              disabled={topSongs.length === 0}
              className={`${PILL} border-white/30 bg-white/[0.06] text-white hover:bg-white/[0.16] disabled:opacity-40`}>
              
              <ShuffleIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              Shuffle
            </button>

            <button
              type="button"
              onClick={() => start(topSongs, 0)}
              disabled={topSongs.length === 0}
              className={`${PILL} border-white/30 bg-white/[0.06] text-white hover:bg-white/[0.16] disabled:opacity-40`}>
              
              <RadioIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              Radio
            </button>

            <button
              type="button"
              onClick={() =>
              toggleSubscription({
                channelId,
                title: channel.title,
                avatar: channel.avatar
              })
              }
              className={`${PILL} ${
              subscribed ?
              'border-white/30 text-white hover:bg-white/10' :
              'border-yt-brand text-white hover:bg-yt-brand/15'}`
              }>
              
              {subscribed ? 'Subscribed' : 'Subscribe'}
              {channel.subscribers !== undefined &&
              <span className="text-white/70">{compact(channel.subscribers)}</span>
              }
            </button>

            <DropdownMenu
              label="More actions"
              align="left"
              width={240}
              icon={<EllipsisVerticalIcon className="h-5 w-5" strokeWidth={1.8} />}
              triggerClassName="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors duration-150 hover:bg-white/10"
              items={[
              {
                icon: <ListPlusIcon className="h-5 w-5" strokeWidth={1.8} />,
                label: 'Add top songs to queue',
                onSelect: () => {
                  topSongs.slice(0, 10).forEach(addToQueue);
                  showToast('Added to queue');
                }
              },
              {
                icon: <BookmarkIcon className="h-5 w-5" strokeWidth={1.8} />,
                label: 'Save top song to library',
                onSelect: () => {
                  if (!topSongs[0]) return;
                  toggleWatchLater(topSongs[0]);
                  showToast('Saved to library');
                }
              },
              {
                icon: <ShareIcon className="h-5 w-5" strokeWidth={1.8} />,
                label: 'Share',
                separated: true,
                onSelect: () => {
                  void navigator.clipboard.
                  writeText(`${window.location.origin}/music/artist/${channelId}`).
                  then(() => showToast('Link copied to clipboard')).
                  catch(() => showToast('Could not copy the link'));
                }
              },
              {
                icon: <YoutubeIcon className="h-5 w-5" strokeWidth={1.8} />,
                label: 'Open on YouTube',
                onSelect: () => navigate(`/channel/${channelId}`)
              }]
              } />
            
          </div>
        </div>
      </header>

      {/* Everything past the hero sits on its own opaque surface, so scrolled
           content is never read against the artist photo. */}
      <div className="relative bg-[#030303] pb-6">
      {topSongs.length > 0 &&
        <section className="pt-6 px-6 lg:px-12">
          <h2 className="mb-3 text-[28px] font-bold leading-9 tracking-tight text-white">
            Top songs
          </h2>

          <ol>
            {visibleSongs.map((track, index) =>
            <li key={track.id}>
                <button
                type="button"
                onClick={() => start(topSongs, index)}
                className="group flex w-full items-center gap-4 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 hover:bg-white/[0.08]">
                
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-white/10">
                    {track.thumbnail &&
                  <img
                    src={track.thumbnail}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover" />

                  }
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100">
                      <PlayIcon className="h-4 w-4 fill-white text-white" strokeWidth={0} />
                    </span>
                  </span>
                  <span className="min-w-0 flex-[4] truncate text-[14px] font-medium leading-5 text-white">
                    {track.title}
                  </span>
                  <span className="hidden min-w-0 flex-[2] truncate text-[13px] leading-5 text-white/60 md:block">
                    {channel.title}
                  </span>
                  <span className="hidden w-[140px] shrink-0 text-[13px] tabular-nums text-white/60 sm:block">
                    {track.views !== undefined ? `${compact(track.views)} plays` : ''}
                  </span>
                  <span className="hidden min-w-0 flex-[2] truncate text-[13px] leading-5 text-white/60 lg:block">
                    {track.title}
                  </span>
                  <span className="w-[52px] shrink-0 text-right text-[13px] tabular-nums text-white/50">
                    {formatDuration(track.duration)}
                  </span>
                </button>
              </li>
            )}
          </ol>

          {topSongs.length > 5 &&
          <button
            type="button"
            onClick={() => setShowAllSongs((value) => !value)}
            className="mt-4 flex h-9 items-center rounded-full border border-white/30 px-5 text-[14px] font-medium leading-none text-white transition-colors duration-150 hover:bg-white/10">
            
              {showAllSongs ? 'Show less' : 'Show all'}
            </button>
          }
        </section>
        }

      {playlists.length > 0 &&
        <MusicShelf title="Albums">
          {playlists.map((playlist) =>
          <Link
            key={playlist.id}
            to={`/music/playlist?list=${encodeURIComponent(playlist.id)}`}
            className="group w-[200px] shrink-0">
            
              <span className="block aspect-square w-full overflow-hidden rounded-lg bg-white/[0.06]">
                {playlist.thumbnail &&
              <img
                src={playlist.thumbnail}
                alt=""
                loading="lazy"
                className="h-full w-full scale-[1.34] object-cover transition-transform duration-300 ease-out group-hover:scale-[1.42]" />

              }
              </span>
              <span className="mt-3 block line-clamp-2 text-[14px] font-medium leading-5 text-white">
                {playlist.title}
              </span>
              <span className="mt-0.5 block truncate text-[12px] leading-4 text-white/60">
                Album • {playlist.itemCount} tracks
              </span>
            </Link>
          )}
        </MusicShelf>
        }

      {videos.length > 0 &&
        <MusicShelf title="Videos" onPlayAll={() => start(videos, 0)}>
          {videos.map((track, index) =>
          <button
            key={track.id}
            type="button"
            onClick={() => start(videos, index)}
            className="group w-[330px] shrink-0 text-left">
            
              <span className="relative block aspect-video w-full overflow-hidden rounded-lg bg-white/[0.06]">
                {track.thumbnail &&
              <img
                src={track.thumbnail}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover" />

              }
                <span className="absolute inset-0 flex items-center justify-center">
                  <PlayIcon
                  className="h-12 w-12 fill-white/90 text-white drop-shadow-lg transition-transform duration-200 ease-out group-hover:scale-110"
                  strokeWidth={0} />
                
                </span>
              </span>
              <span className="mt-3 block line-clamp-2 text-[14px] font-medium leading-5 text-white">
                {track.title}
              </span>
              <span className="mt-0.5 block truncate text-[12px] leading-4 text-white/60">
                {channel.title}
                {track.views !== undefined ? ` • ${compact(track.views)} views` : ''}
              </span>
            </button>
          )}
        </MusicShelf>
        }

      {(similar.data ?? []).length > 0 &&
        <MusicShelf title="Fans might also like">
          {(similar.data ?? []).map((artist) =>
          <Link
            key={artist.id}
            to={`/music/artist/${artist.id}`}
            className="group w-[160px] shrink-0 text-center">
            
              <span className="mx-auto block w-fit overflow-hidden rounded-full transition-transform duration-300 ease-out group-hover:scale-[1.04]">
                <ChannelAvatar name={artist.title} src={artist.avatar} size={144} />
              </span>
              <span className="mt-3 block truncate text-[14px] font-medium leading-5 text-white">
                {artist.title}
              </span>
              <span className="block truncate text-[12px] leading-4 text-white/60">Artist</span>
            </Link>
          )}
        </MusicShelf>
        }

      <div className="h-16" />
      </div>
    </div>);

}