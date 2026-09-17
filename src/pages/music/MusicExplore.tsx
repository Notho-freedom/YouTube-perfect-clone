import React from 'react';
import { Link } from 'react-router-dom';
import { DiscAlbumIcon, PlayIcon, SmileIcon, TrendingUpIcon } from 'lucide-react';
import { MusicShelf } from '../../components/music/MusicShelf';
import { useAsync } from '../../hooks/useAsync';
import { useMusicPlayback } from '../../hooks/useMusicPlayback';
import type { Video } from '../../types/youtube';
import { compact } from '../../utils/format';
import { fetchByCategory, searchVideos } from '../../utils/youtubeApi';

/** Music's mood tiles, each with its own accent stripe. */
const MOODS: Array<{label: string;accent: string;}> = [
{ label: 'Energy boosters', accent: '#f5c518' },
{ label: 'Pop', accent: '#e255c9' },
{ label: 'Dance & electronic', accent: '#2fb6c9' },
{ label: 'Iraqi', accent: '#e8703a' },
{ label: 'Family', accent: '#3aa0e8' },
{ label: 'Sad', accent: '#8b95a8' },
{ label: 'Commute', accent: '#f5b942' },
{ label: 'Chill', accent: '#7d8ff5' },
{ label: 'Bollywood & Indian', accent: '#4fc98a' },
{ label: 'Autumn', accent: '#c97a3a' },
{ label: 'Focus', accent: '#9aa3b0' },
{ label: 'Rock en español', accent: '#e05353' },
{ label: 'Jazz', accent: '#3ab0a0' },
{ label: 'Latin', accent: '#f0b429' },
{ label: 'Party', accent: '#b56bf0' },
{ label: 'French hip hop', accent: '#e8703a' },
{ label: 'Romance', accent: '#e8434f' },
{ label: '1950s', accent: '#4fc98a' }];


const QUICK_LINKS = [
{ label: 'New releases', icon: DiscAlbumIcon, query: 'new album release official audio' },
{ label: 'Charts', icon: TrendingUpIcon, query: 'top songs this week' },
{ label: 'Moods & genres', icon: SmileIcon, query: 'mood playlist mix' }];


function ArtworkTile({
  track,
  onPlay,
  kind




}: {track: Video;onPlay: () => void;kind: string;}) {
  return (
    <button type="button" onClick={onPlay} className="group w-[200px] shrink-0 text-left">
      <span className="relative block aspect-square w-full overflow-hidden rounded-lg bg-white/[0.06]">
        {track.thumbnail &&
        <img
          src={track.thumbnail}
          alt=""
          loading="lazy"
          className="h-full w-full scale-[1.34] object-cover" />

        }
        <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100">
          <PlayIcon className="h-10 w-10 fill-white text-white" strokeWidth={0} />
        </span>
      </span>
      <span className="mt-3 block line-clamp-2 text-[14px] font-medium leading-5 text-white">
        {track.title}
      </span>
      <span className="mt-0.5 block line-clamp-2 text-[12px] leading-4 text-white/60">
        {kind} • {track.channelTitle}
      </span>
    </button>);

}

export function MusicExplore() {
  const start = useMusicPlayback();

  const state = useAsync(async () => {
    const [releases, trending, clips] = await Promise.all([
    searchVideos('new album release official audio', 16).catch(() => [] as Video[]),
    fetchByCategory('10', 24).catch(() => [] as Video[]),
    searchVideos('new official music video', 16).catch(() => [] as Video[])]
    );
    return { releases, trending, clips };
  }, []);

  const releases = state.data?.releases ?? [];
  const trending = state.data?.trending ?? [];
  const clips = state.data?.clips ?? [];

  return (
    <div className="pt-6">
      <div className="grid grid-cols-1 gap-4 px-6 sm:grid-cols-3 lg:px-12">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              to={`/music/search?q=${encodeURIComponent(link.query)}`}
              className="flex h-[68px] items-center gap-4 rounded-lg bg-white/[0.06] px-6 text-[20px] font-bold leading-7 text-white transition-colors duration-150 hover:bg-white/[0.12]">
              
              <Icon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
              {link.label}
            </Link>);

        })}
      </div>

      {state.loading &&
      <div className="mt-10 flex gap-4 px-6 lg:px-12" aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) =>
        <div key={index} className="w-[200px] shrink-0 animate-pulse">
              <div className="aspect-square w-full rounded-lg bg-white/[0.06]" />
              <div className="mt-3 h-3 w-3/4 rounded bg-white/[0.06]" />
              <div className="mt-2 h-3 w-1/2 rounded bg-white/[0.06]" />
            </div>
        )}
        </div>
      }

      {releases.length > 0 &&
      <MusicShelf
        title="New albums & singles"
        moreTo="/music/search?q=new%20album%20release"
        onPlayAll={() => start(releases, 0)}>
        
          {releases.map((track, index) =>
        <ArtworkTile
          key={track.id}
          track={track}
          kind="Album"
          onPlay={() => start(releases, index)} />

        )}
        </MusicShelf>
      }

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4 px-6 lg:px-12">
          <h2 className="text-[28px] font-bold leading-9 tracking-tight text-white">
            Moods &amp; genres
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 px-6 sm:grid-cols-3 lg:grid-cols-6 lg:px-12">
          {MOODS.map((mood) =>
          <Link
            key={mood.label}
            to={`/music/search?q=${encodeURIComponent(`${mood.label} music mix`)}`}
            className="flex h-[52px] items-center overflow-hidden rounded bg-white/[0.06] transition-colors duration-150 hover:bg-white/[0.12]">
            
              <span
              aria-hidden="true"
              className="h-full w-1 shrink-0"
              style={{ backgroundColor: mood.accent }} />
            
              <span className="truncate px-4 text-[14px] font-medium leading-5 text-white">
                {mood.label}
              </span>
            </Link>
          )}
        </div>
      </section>

      {trending.length > 0 &&
      <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4 px-6 lg:px-12">
            <h2 className="text-[28px] font-bold leading-9 tracking-tight text-white">Trending</h2>
            <button
            type="button"
            onClick={() => start(trending, 0)}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-4 text-[12px] font-medium leading-none text-white transition-colors duration-150 hover:bg-white/20">
            
              <PlayIcon className="h-4 w-4 fill-current" strokeWidth={0} />
              Play all
            </button>
          </div>

          {/* Music lays the chart out in three numbered columns, reading down. */}
          <ol className="grid grid-cols-1 gap-x-10 px-6 md:grid-cols-2 xl:grid-cols-3 lg:px-12">
            {trending.slice(0, 12).map((track, index) =>
          <li key={track.id}>
                <button
              type="button"
              onClick={() => start(trending, index)}
              className="group flex w-full items-center gap-4 rounded-lg p-2 text-left transition-colors duration-150 hover:bg-white/[0.08]">
              
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
                  <span className="w-5 shrink-0 text-center text-[14px] tabular-nums text-white/70">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium leading-5 text-white">
                      {track.title}
                    </span>
                    <span className="block truncate text-[12px] leading-4 text-white/60">
                      {track.channelTitle}
                      {track.views !== undefined && ` • ${compact(track.views)} views`}
                    </span>
                  </span>
                </button>
              </li>
          )}
          </ol>
        </section>
      }

      {clips.length > 0 &&
      <MusicShelf title="New music videos" onPlayAll={() => start(clips, 0)}>
          {clips.map((track, index) =>
        <button
          key={track.id}
          type="button"
          onClick={() => start(clips, index)}
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
                className="h-12 w-12 fill-white/90 text-white opacity-90 drop-shadow-lg transition-transform duration-200 ease-out group-hover:scale-110"
                strokeWidth={0} />
              
                </span>
              </span>
              <span className="mt-3 block line-clamp-2 text-[14px] font-medium leading-5 text-white">
                {track.title}
              </span>
              <span className="mt-0.5 block truncate text-[12px] leading-4 text-white/60">
                {track.channelTitle}
                {track.views !== undefined && ` • ${compact(track.views)} views`}
              </span>
            </button>
        )}
        </MusicShelf>
      }
    </div>);

}