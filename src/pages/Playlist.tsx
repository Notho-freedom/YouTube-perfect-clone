import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ListVideoIcon, PlayIcon, ShuffleIcon, Trash2Icon } from 'lucide-react';
import { CompactVideoCard } from '../components/video/CompactVideoCard';
import { CompactVideoSkeleton } from '../components/video/Skeletons';
import { useLibrary } from '../contexts/LibraryContext';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlaylist } from '../hooks/usePlaylist';
import { formatFull } from '../utils/format';
import { FeedPlaceholder } from './FeedPlaceholder';

export function Playlist() {
  const [params] = useSearchParams();
  const listId = params.get('list');
  const navigate = useNavigate();
  const { playlist, loading, error } = usePlaylist(listId);
  const { toggleWatchLater, togglePlaylistVideo, playlists, watchLater, likes } = useLibrary();
  const { playList } = usePlayer();

  // Sibling lists shown in the left column. Built from the native library plus
  // the two standing lists, minus whichever one is open.
  const others = React.useMemo(
    () =>
    [
    { id: 'WL', title: 'Watch later', thumbnail: watchLater[0]?.thumbnail ?? '', itemCount: watchLater.length },
    { id: 'LL', title: 'Liked videos', thumbnail: likes[0]?.thumbnail ?? '', itemCount: likes.length },
    ...playlists.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.videos[0]?.thumbnail ?? '',
      itemCount: item.videos.length
    }))].
    filter((item) => item.id !== listId && item.itemCount > 0),
    [playlists, watchLater, likes, listId]
  );

  const removeFromList = (videoId: string) => {
    const video = playlist?.videos.find((item) => item.id === videoId);
    if (!video || !listId) return;
    if (listId === 'WL') toggleWatchLater(video);else
    togglePlaylistVideo(listId, video);
  };

  if (!listId || error) {
    return (
      <FeedPlaceholder
        title="This playlist isn't available"
        description="The list could not be loaded. It may be private, empty, or the API quota is exhausted." />);


  }

  const videos = playlist?.videos ?? [];
  const cover = videos[0]?.thumbnail;

  const start = (index: number, shuffle = false) => {
    if (videos.length === 0) return;
    const ordered = shuffle ? [...videos].sort(() => Math.random() - 0.5) : videos;
    playList(ordered, shuffle ? 0 : index, listId);
    navigate(`/watch?v=${ordered[shuffle ? 0 : index].id}&list=${encodeURIComponent(listId)}`);
  };

  return (
    <div className="px-4 pb-16 pt-6 sm:px-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Fixed detail column: it hugs its content and stays put while the
             track list scrolls, exactly like YouTube's playlist view. */}
        <aside className="h-fit w-full shrink-0 rounded-xl bg-yt-chip p-6 lg:sticky lg:top-[72px] lg:w-[360px]">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-yt-skeleton">
            {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-[2px] text-[12px] font-medium text-white">
              <ListVideoIcon className="h-4 w-4" strokeWidth={1.8} />
              {formatFull(videos.length)}
            </span>
          </div>

          <h1 className="mt-4 text-[28px] font-bold leading-9 text-yt-text">
            {playlist?.title ?? 'Playlist'}
          </h1>
          {playlist?.subtitle &&
          <p className="mt-1 text-[14px] leading-5 text-yt-text">{playlist.subtitle}</p>
          }
          <p className="mt-1 text-[12px] leading-[18px] text-yt-sub">
            {videos.length} {videos.length === 1 ? 'video' : 'videos'}
          </p>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => start(0)}
              disabled={videos.length === 0}
              className="flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-yt-inverse px-4 text-[14px] font-medium leading-none text-yt-inverseText transition-opacity duration-150 hover:opacity-90 disabled:opacity-40">
              
              <PlayIcon className="h-5 w-5 fill-current" strokeWidth={0} />
              Play all
            </button>
            <button
              type="button"
              onClick={() => start(0, true)}
              disabled={videos.length === 0}
              className="flex h-9 items-center justify-center gap-2 rounded-full bg-yt-chipHover px-4 text-[14px] font-medium leading-none text-yt-text transition-opacity duration-150 hover:opacity-90 disabled:opacity-40">
              
              <ShuffleIcon className="h-5 w-5" strokeWidth={1.8} />
              Shuffle
            </button>
          </div>

          {/* Your other lists, right here: switching between playlists should
               not mean going back out to the library every time. */}
          {others.length > 0 &&
          <nav className="mt-6 border-t border-yt-border pt-4" aria-label="Your other playlists">
              <h2 className="mb-2 text-[14px] font-medium leading-5 text-yt-text">
                Your other playlists
              </h2>
              <ul>
                {others.map((item) =>
              <li key={item.id}>
                    <Link
                  to={`/playlist?list=${encodeURIComponent(item.id)}`}
                  className="flex items-center gap-3 rounded-lg px-1 py-2 transition-colors duration-150 hover:bg-yt-hover">
                  
                      <span className="h-10 w-[68px] shrink-0 overflow-hidden rounded bg-yt-skeleton">
                        {item.thumbnail &&
                    <img
                      src={item.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover" />

                    }
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium leading-[19px] text-yt-text">
                          {item.title}
                        </span>
                        <span className="block text-[12px] leading-[18px] text-yt-sub">
                          {item.itemCount} {item.itemCount === 1 ? 'video' : 'videos'}
                        </span>
                      </span>
                    </Link>
                  </li>
              )}
              </ul>
            </nav>
          }
        </aside>

        <div className="min-w-0 flex-1">
          {loading &&
          <div className="space-y-3" aria-busy="true">
              {Array.from({ length: 8 }).map((_, index) =>
            <CompactVideoSkeleton key={index} />
            )}
            </div>
          }

          {!loading && videos.length === 0 &&
          <p className="py-16 text-[14px] leading-5 text-yt-sub">This list is empty.</p>
          }

          {!loading && videos.length > 0 &&
          <ol className="space-y-2">
              {videos.map((video, index) =>
            <li key={`${video.id}-${index}`} className="flex items-start gap-2">
                  <button
                type="button"
                onClick={() => start(index)}
                aria-label={`Play ${video.title}`}
                className="mt-6 w-6 shrink-0 text-center text-[12px] leading-[18px] text-yt-sub hover:text-yt-text">
                
                    {index + 1}
                  </button>
                  <div className="min-w-0 flex-1">
                    <Link
                  to={`/watch?v=${video.id}&list=${encodeURIComponent(listId)}`}
                  onClick={() => playList(videos, index, listId)}
                  className="block">
                  
                      <CompactVideoCard video={video} />
                    </Link>
                  </div>
                  {playlist?.local &&
              <button
                type="button"
                onClick={() => removeFromList(video.id)}
                aria-label={`Remove ${video.title}`}
                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
                
                      <Trash2Icon className="h-5 w-5" strokeWidth={1.8} />
                    </button>
              }
                </li>
            )}
            </ol>
          }
        </div>
      </div>
    </div>);

}