import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon } from 'lucide-react';
import { MusicShelf } from '../../components/music/MusicShelf';
import { MusicTrackRow } from '../../components/music/MusicTrackRow';
import { useLibrary } from '../../contexts/LibraryContext';
import { useAsync } from '../../hooks/useAsync';
import { useMusicPlayback } from '../../hooks/useMusicPlayback';
import { useMyChannel, useTasteSignals } from '../../hooks/useMyYouTube';
import type { Video } from '../../types/youtube';
import { buildMixes } from '../../utils/mixes';
import { tasteProfile } from '../../utils/recommendations';
import { fetchByCategory, searchVideos } from '../../utils/youtubeApi';

const MOODS = [
'Energise',
'Relax',
'Workout',
'Commute',
'Focus',
'Feel good',
'Sleep',
'Party',
'Sad'];


interface ArtworkCardProps {
  title: string;
  subtitle: string;
  thumbnail?: string;
  to?: string;
  onPlay?: () => void;
  /** Square for albums and mixes, 16:9 for music videos. */
  wide?: boolean;
}

function ArtworkCard({ title, subtitle, thumbnail, to, onPlay, wide = false }: ArtworkCardProps) {
  const media =
  <span
    className={`relative block w-full overflow-hidden rounded-lg bg-white/10 ${
    wide ? 'aspect-video' : 'aspect-square'}`
    }>
    
      {thumbnail &&
    <img
      src={thumbnail}
      alt=""
      loading="lazy"
      // Square artwork zooms past the 16:9 thumbnail's letterboxing.
      className={`h-full w-full object-cover ${wide ? '' : 'scale-[1.34]'}`} />

    }
      <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100">
        <PlayIcon className="h-10 w-10 fill-white text-white" strokeWidth={0} />
      </span>
    </span>;


  const body =
  <>
      {media}
      <span className="mt-3 block line-clamp-2 text-[14px] font-medium leading-5 text-white">
        {title}
      </span>
      <span className="mt-0.5 block line-clamp-2 text-[12px] leading-4 text-white/60">
        {subtitle}
      </span>
    </>;


  const className = `group shrink-0 text-left ${wide ? 'w-[330px]' : 'w-[200px]'}`;

  if (to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>);

  }

  return (
    <button type="button" onClick={onPlay} className={className}>
      {body}
    </button>);

}

export function MusicHome() {
  const [mood, setMood] = useState('Energise');
  const signals = useTasteSignals();
  const { likes } = useLibrary();
  const { channel: me } = useMyChannel();
  const start = useMusicPlayback();

  const profile = useMemo(() => tasteProfile(signals, 4), [signals]);
  const topicKey = profile.map((topic) => topic.keyword).join(',');

  const state = useAsync(async () => {
    const [charts, moodTracks, forYou] = await Promise.all([
    fetchByCategory('10', 30).catch(() => [] as Video[]),
    searchVideos(`${mood} music mix`, 12).catch(() => [] as Video[]),
    profile.length > 0 ?
    searchVideos(`${profile[0].keyword} music`, 12).catch(() => [] as Video[]) :
    Promise.resolve([] as Video[])]
    );
    return { charts, moodTracks, forYou };
  }, [mood, topicKey]);

  const charts = state.data?.charts ?? [];
  const moodTracks = state.data?.moodTracks ?? [];
  const forYou = state.data?.forYou ?? [];

  const listenAgain = useMemo(
    () => signals.history.slice(0, 12).map((entry) => entry.video),
    [signals.history]
  );
  const mixes = useMemo(() => buildMixes(signals, 8), [signals]);

  const quickPicks = charts.slice(0, 12);
  const queue = [...quickPicks, ...moodTracks];

  return (
    <div>
      <div className="no-scrollbar flex items-center gap-3 overflow-x-auto px-6 py-5 lg:px-12">
        {MOODS.map((item) =>
        <button
          key={item}
          type="button"
          onClick={() => setMood(item)}
          aria-pressed={item === mood}
          className={`flex h-8 shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-[14px] font-medium leading-none transition-colors duration-150 ${
          item === mood ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`
          }>
          
            {item}
          </button>
        )}
      </div>

      {listenAgain.length > 0 &&
      <MusicShelf
        title="Listen again"
        eyebrow={me?.title ?? 'Your history'}
        eyebrowAvatar={me?.avatar}
        onPlayAll={() => start(listenAgain, 0)}>
        
          {listenAgain.map((track, index) =>
        <ArtworkCard
          key={track.id}
          title={track.title}
          subtitle={track.channelTitle}
          thumbnail={track.thumbnail}
          onPlay={() => start(listenAgain, index)} />

        )}
        </MusicShelf>
      }

      <section className="mt-10 px-6 lg:px-12">
        <h2 className="mb-1 text-[28px] font-bold leading-9 tracking-tight">Quick picks</h2>
        <p className="mb-4 text-[12px] leading-4 text-white/60">
          Start radio from a song — playback follows you across YouTube and Music
        </p>

        {state.loading ?
        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) =>
          <div key={index} className="flex animate-pulse items-center gap-3 p-2">
                <div className="h-12 w-12 shrink-0 rounded bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-white/10" />
                  <div className="h-3 w-1/3 rounded bg-white/10" />
                </div>
              </div>
          )}
          </div> :
        quickPicks.length === 0 ?
        <p className="py-10 text-[14px] text-white/60">
            No music available right now — the API quota may be exhausted.
          </p> :

        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2 xl:grid-cols-3">
            {quickPicks.map((track, index) =>
          <MusicTrackRow key={track.id} track={track} onPlay={() => start(queue, index)} />
          )}
          </div>
        }
      </section>

      {mixes.length > 0 &&
      <MusicShelf title="Mixed for you" eyebrow="Built from what you play">
          {mixes.map((mix) =>
        <ArtworkCard
          key={mix.id}
          title={mix.title}
          subtitle={mix.subtitle}
          thumbnail={mix.thumbnail}
          to={`/music/playlist?list=${encodeURIComponent(mix.id)}`} />

        )}
        </MusicShelf>
      }

      {forYou.length > 0 &&
      <MusicShelf
        title="Music videos for you"
        eyebrow={profile[0]?.keyword ?? ''}
        onPlayAll={() => start(forYou, 0)}>
        
          {forYou.map((track, index) =>
        <ArtworkCard
          key={track.id}
          wide
          title={track.title}
          subtitle={track.channelTitle}
          thumbnail={track.thumbnail}
          onPlay={() => start(forYou, index)} />

        )}
        </MusicShelf>
      }

      {likes.length > 0 &&
      <MusicShelf
        title="From your library"
        eyebrow="Liked music"
        onPlayAll={() => start(likes, 0)}>
        
          {likes.slice(0, 12).map((track, index) =>
        <ArtworkCard
          key={track.id}
          title={track.title}
          subtitle={track.channelTitle}
          thumbnail={track.thumbnail}
          onPlay={() => start(likes, index)} />

        )}
        </MusicShelf>
      }

      {moodTracks.length > 0 &&
      <section className="mt-10 px-6 lg:px-12">
          <h2 className="mb-4 text-[28px] font-bold leading-9 tracking-tight">{mood} picks</h2>
          <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2 xl:grid-cols-3">
            {moodTracks.map((track, index) =>
          <MusicTrackRow
            key={track.id}
            track={track}
            onPlay={() => start(queue, quickPicks.length + index)} />

          )}
          </div>
        </section>
      }
    </div>);

}