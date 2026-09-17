import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDownIcon, ThumbsUpIcon } from 'lucide-react';
import { MusicTrackRow } from '../../components/music/MusicTrackRow';
import { useLibrary } from '../../contexts/LibraryContext';
import { useMusicPlayback } from '../../hooks/useMusicPlayback';
import { useMusicPodcasts } from '../../hooks/useMusicPodcasts';
import { useMySubscriptions, useTasteSignals } from '../../hooks/useMyYouTube';
import { buildMixes } from '../../utils/mixes';

const TABS = ['Playlists', 'Songs', 'Albums', 'Artists', 'Podcasts'] as const;
type Tab = (typeof TABS)[number];

const SORTS = ['Recent activity', 'A to Z', 'Recently added'] as const;
type Sort = (typeof SORTS)[number];

interface LibraryCard {
  id: string;
  title: string;
  subtitle: string;
  thumbnail?: string;
  to: string;
  /** Artists and profiles are round in Music; playlists are square. */
  round?: boolean;
  /** The Liked-music tile uses Music's pink thumb artwork. */
  liked?: boolean;
}

export function MusicLibrary() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab') as Tab | null;
  const [tab, setTab] = useState<Tab>(TABS.includes(tabParam as Tab) ? tabParam as Tab : 'Playlists');
  const [sort, setSort] = useState<Sort>('Recent activity');
  const [sortOpen, setSortOpen] = useState(false);

  const { playlists, likes, watchLater, history } = useLibrary();
  const { subscriptions } = useMySubscriptions();
  const signals = useTasteSignals();
  const start = useMusicPlayback();

  const mixes = useMemo(() => buildMixes(signals, 8), [signals]);
  const listenAgain = history.map((entry) => entry.video);

  const playlistCards: LibraryCard[] = [
  {
    id: 'LL',
    title: 'Liked music',
    subtitle: `Auto playlist • ${likes.length} songs`,
    thumbnail: likes[0]?.thumbnail,
    to: '/music/playlist?list=LL',
    liked: true
  },
  {
    id: 'WL',
    title: 'Saved',
    subtitle: `Playlist • ${watchLater.length} items`,
    thumbnail: watchLater[0]?.thumbnail,
    to: '/music/playlist?list=WL'
  },
  ...playlists.map((playlist) => ({
    id: playlist.id,
    title: playlist.title,
    subtitle: `Playlist • ${playlist.videos.length} songs`,
    thumbnail: playlist.videos[0]?.thumbnail,
    to: `/music/playlist?list=${encodeURIComponent(playlist.id)}`
  })),
  ...mixes.map((mix) => ({
    id: mix.id,
    title: mix.title,
    subtitle: `Mix • ${mix.subtitle}`,
    thumbnail: mix.thumbnail,
    to: `/music/playlist?list=${encodeURIComponent(mix.id)}`
  }))];


  // Podcasts are only fetched when their tab is open — each search costs quota.
  const { shows, loading: podcastsLoading } = useMusicPodcasts(tab === 'Podcasts');
  const podcastCards: LibraryCard[] = shows.map((show) => ({
    id: show.channelId,
    title: show.title,
    subtitle: `Podcast • ${show.episodes.length} episodes`,
    thumbnail: show.thumbnail,
    to: `/music/artist/${show.channelId}`
  }));

  const artistCards: LibraryCard[] = subscriptions.map((item) => ({
    id: item.channelId,
    title: item.title,
    subtitle: 'Artist',
    thumbnail: item.avatar,
    to: `/music/artist/${item.channelId}`,
    round: true
  }));

  const cards = useMemo(() => {
    const base =
    tab === 'Artists' ?
    artistCards :
    tab === 'Albums' ?
    playlistCards.filter((card) => card.subtitle.startsWith('Playlist')) :
    tab === 'Podcasts' ?
    podcastCards :
    [...playlistCards, ...artistCards];
    if (sort === 'A to Z') return [...base].sort((a, b) => a.title.localeCompare(b.title));
    return base;
  }, [tab, sort, playlistCards, artistCards, podcastCards]);

  const selectTab = (next: Tab) => {
    setTab(next);
    const nextParams = new URLSearchParams(params);
    nextParams.set('tab', next);
    setParams(nextParams, { replace: true });
  };

  return (
    <div className="px-6 pb-16 pt-6 lg:px-12">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        {TABS.map((item) =>
        <button
          key={item}
          type="button"
          onClick={() => selectTab(item)}
          aria-pressed={item === tab}
          className={`flex h-8 shrink-0 items-center rounded px-4 text-[14px] font-medium leading-none transition-colors duration-150 ${
          item === tab ?
          'bg-white text-black' :
          'bg-white/[0.08] text-white hover:bg-white/[0.16]'}`
          }>
          
            {item}
          </button>
        )}

        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setSortOpen((value) => !value)}
            aria-expanded={sortOpen}
            className="flex h-10 items-center gap-2 rounded-full bg-white/[0.08] px-5 text-[14px] font-medium leading-none text-white transition-colors duration-150 hover:bg-white/[0.16]">
            
            {sort}
            <ChevronDownIcon className="h-4 w-4" strokeWidth={2} />
          </button>
          {sortOpen &&
          <ul className="absolute right-0 top-12 z-20 w-[200px] overflow-hidden rounded-lg bg-[#212121] py-2 shadow-[0_4px_32px_rgba(0,0,0,0.6)]">
              {SORTS.map((item) =>
            <li key={item}>
                  <button
                type="button"
                onClick={() => {
                  setSort(item);
                  setSortOpen(false);
                }}
                className={`flex h-9 w-full items-center px-4 text-left text-[14px] leading-5 transition-colors duration-150 hover:bg-white/10 ${
                item === sort ? 'text-white' : 'text-white/70'}`
                }>
                
                    {item}
                  </button>
                </li>
            )}
            </ul>
          }
        </div>
      </div>

      {tab === 'Songs' ?
      <div>
          {likes.length === 0 && listenAgain.length === 0 ?
        <p className="py-16 text-[14px] leading-5 text-white/60">
              Songs you like will show up here.
            </p> :

        (likes.length > 0 ? likes : listenAgain).map((track, index) =>
        <MusicTrackRow
          key={`${track.id}-${index}`}
          track={track}
          index={index}
          onPlay={() => start(likes.length > 0 ? likes : listenAgain, index)} />

        )
        }
        </div> :
      tab === 'Podcasts' && podcastsLoading ?
      <div
        className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
        aria-busy="true">
        
          {Array.from({ length: 12 }).map((_, index) =>
        <div key={index} className="animate-pulse">
              <div className="aspect-square w-full rounded-lg bg-white/[0.06]" />
              <div className="mt-3 h-3 w-3/4 rounded bg-white/[0.06]" />
              <div className="mt-2 h-3 w-1/2 rounded bg-white/[0.06]" />
            </div>
        )}
        </div> :
      cards.length === 0 ?
      <p className="py-16 text-[14px] leading-5 text-white/60">
          {tab === 'Podcasts' ?
        'No shows matched your listening yet.' :
        'Nothing saved here yet.'}
        </p> :

      <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {cards.map((card) =>
        <Link key={card.id} to={card.to} className="group block">
              <span
            className={`relative block aspect-square w-full overflow-hidden bg-white/[0.06] ${
            card.round ? 'rounded-full' : 'rounded-lg'}`
            }>
            
                {card.liked ?
            <span className="flex h-full w-full items-center justify-center bg-[#c150f6]">
                    <ThumbsUpIcon className="h-1/2 w-1/2 fill-white text-white" strokeWidth={0} />
                  </span> :

            card.thumbnail &&
            <img
              src={card.thumbnail}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]" />


            }
              </span>
              <span className="mt-3 block truncate text-[14px] font-medium leading-5 text-white">
                {card.title}
              </span>
              <span className="mt-0.5 block text-[12px] leading-4 text-white/60 line-clamp-2">
                {card.subtitle}
              </span>
            </Link>
        )}
        </div>
      }
    </div>);

}