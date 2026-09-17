import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PlayIcon } from 'lucide-react';
import { MusicTrackRow } from '../../components/music/MusicTrackRow';
import { ChannelAvatar } from '../../components/video/ChannelAvatar';
import { useAsync } from '../../hooks/useAsync';
import { useMusicPlayback } from '../../hooks/useMusicPlayback';
import type { ChannelDetails, Video } from '../../types/youtube';
import { compact, compactPrecise } from '../../utils/format';
import { searchChannel, searchVideos } from '../../utils/youtubeApi';

const TABS = ['All', 'Songs', 'Videos', 'Artists'] as const;
type Tab = (typeof TABS)[number];

export function MusicSearch() {
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';
  const [tab, setTab] = useState<Tab>('All');
  const start = useMusicPlayback();

  const state = useAsync(async () => {
    if (!query.trim()) return { songs: [] as Video[], videos: [] as Video[], artist: null };
    const [songs, videos, artist] = await Promise.all([
    // "Songs" leans on the music category so covers and audio come first.
    searchVideos(`${query} song audio`, 20).catch(() => [] as Video[]),
    searchVideos(query, 20).catch(() => [] as Video[]),
    searchChannel(query).catch(() => null as ChannelDetails | null)]
    );
    return { songs, videos, artist };
  }, [query]);

  const songs = state.data?.songs ?? [];
  const videos = state.data?.videos ?? [];
  const artist = state.data?.artist ?? null;
  const top = songs[0] ?? videos[0];

  if (!query.trim()) {
    return (
      <p className="px-6 py-16 text-[14px] leading-5 text-white/60">
        Search for a song, an album or an artist.
      </p>);

  }

  if (state.loading) {
    return (
      <div className="space-y-3 px-4 py-8 sm:px-6" aria-busy="true">
        {Array.from({ length: 8 }).map((_, index) =>
        <div key={index} className="flex animate-pulse items-center gap-3">
            <div className="h-12 w-12 shrink-0 rounded bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded bg-white/10" />
              <div className="h-3 w-1/5 rounded bg-white/10" />
            </div>
          </div>
        )}
      </div>);

  }

  return (
    <div className="px-6 pb-16 pt-6 lg:px-12">
      <div className="no-scrollbar mb-6 flex gap-3 overflow-x-auto">
        {TABS.map((item) =>
        <button
          key={item}
          type="button"
          onClick={() => setTab(item)}
          aria-pressed={item === tab}
          className={`flex h-8 shrink-0 items-center rounded-lg px-3 text-[14px] font-medium leading-none transition-colors duration-150 ${
          item === tab ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`
          }>
          
            {item}
          </button>
        )}
      </div>

      {tab === 'All' && top &&
      <section className="mb-10">
          <h2 className="mb-4 text-[20px] font-bold leading-7">Top result</h2>
          <div className="flex max-w-[520px] items-center gap-4 rounded-xl bg-white/[0.06] p-4">
            <button
            type="button"
            onClick={() => start(songs.length > 0 ? songs : videos, 0)}
            aria-label={`Play ${top.title}`}
            className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-white/10">
            
              {top.thumbnail &&
            <img src={top.thumbnail} alt="" className="h-full w-full object-cover" />
            }
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100">
                <PlayIcon className="h-8 w-8 fill-white text-white" strokeWidth={0} />
              </span>
            </button>
            <div className="min-w-0">
              <p className="text-[12px] uppercase tracking-wide text-white/60">Song</p>
              <p className="mt-1 line-clamp-2 text-[20px] font-bold leading-7">{top.title}</p>
              <p className="mt-1 truncate text-[12px] leading-4 text-white/60">
                {[top.channelTitle, top.views !== undefined && `${compact(top.views)} plays`].
              filter(Boolean).
              join(' • ')}
              </p>
            </div>
          </div>
        </section>
      }

      {(tab === 'All' || tab === 'Artists') && artist &&
      <section className="mb-10">
          <h2 className="mb-4 text-[20px] font-bold leading-7">Artists</h2>
          <Link
          to={`/music/artist/${artist.id}`}
          className="flex w-fit items-center gap-4 rounded-xl p-2 transition-colors duration-150 hover:bg-white/10">
          
            <ChannelAvatar name={artist.title} src={artist.avatar} size={72} />
            <span>
              <span className="block text-[16px] font-medium leading-6 text-white">
                {artist.title}
              </span>
              {artist.subscribers !== undefined &&
            <span className="block text-[12px] leading-4 text-white/60">
                  Artist • {compactPrecise(artist.subscribers)} subscribers
                </span>
            }
            </span>
          </Link>
        </section>
      }

      {(tab === 'All' || tab === 'Songs') && songs.length > 0 &&
      <section className="mb-10">
          <h2 className="mb-2 text-[20px] font-bold leading-7">Songs</h2>
          <div>
            {(tab === 'All' ? songs.slice(0, 6) : songs).map((track, index) =>
          <MusicTrackRow key={track.id} track={track} onPlay={() => start(songs, index)} />
          )}
          </div>
        </section>
      }

      {(tab === 'All' || tab === 'Videos') && videos.length > 0 &&
      <section>
          <h2 className="mb-2 text-[20px] font-bold leading-7">Videos</h2>
          <div>
            {(tab === 'All' ? videos.slice(0, 6) : videos).map((track, index) =>
          <MusicTrackRow key={track.id} track={track} onPlay={() => start(videos, index)} />
          )}
          </div>
        </section>
      }

      {songs.length === 0 && videos.length === 0 && !artist &&
      <p className="py-16 text-[14px] leading-5 text-white/60">
          No results for “{query}”.
        </p>
      }
    </div>);

}