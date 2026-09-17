import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookmarkCheckIcon,
  BookmarkIcon,
  EllipsisVerticalIcon,
  ListPlusIcon,
  PlayIcon,
  ShareIcon,
  ShuffleIcon,
  YoutubeIcon } from
'lucide-react';
import { MusicTrackRow } from '../../components/music/MusicTrackRow';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { useLibrary } from '../../contexts/LibraryContext';
import { useToast } from '../../contexts/ToastContext';
import { useDominantColor } from '../../hooks/useDominantColor';
import { useMusicPlayback } from '../../hooks/useMusicPlayback';
import { usePlaylist } from '../../hooks/usePlaylist';
import { durationToSeconds } from '../../utils/format';

function totalRuntime(seconds: number): string {
  if (seconds <= 0) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round(seconds % 3600 / 60);
  return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
}

/**
 * Album and playlist detail inside YouTube Music.
 *
 * Deliberately separate from the YouTube playlist page: Music leads with the
 * square artwork and the actions, and the track list is a plain numbered
 * column rather than video rows with thumbnails.
 */
export function MusicPlaylist() {
  const [params] = useSearchParams();
  const listId = params.get('list');
  const { playlist, loading, error } = usePlaylist(listId);
  const { toggleWatchLater, isInWatchLater, addToQueue } = useLibrary();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const start = useMusicPlayback();

  const tracks = playlist?.videos ?? [];
  const artwork = playlist?.meta?.thumbnail ?? tracks[0]?.thumbnail;
  const rgb = useDominantColor(artwork);
  const saved = tracks[0] ? isInWatchLater(tracks[0].id) : false;

  const runtime = totalRuntime(
    tracks.reduce((total, track) => total + durationToSeconds(track.duration), 0)
  );

  if (error || !loading && !playlist) {
    return (
      <div className="px-8 py-24 text-center">
        <h1 className="text-[20px] font-bold leading-7 text-white">Playlist unavailable</h1>
        <p className="mt-2 text-[14px] leading-5 text-white/60">
          It may be private, or removed by its owner.
        </p>
        <Link
          to="/music"
          className="mt-6 inline-flex h-9 items-center rounded-full bg-white px-4 text-[14px] font-medium leading-none text-black transition-colors duration-150 hover:bg-white/90">
          
          Back to Home
        </Link>
      </div>);

  }

  const shuffle = () => {
    if (tracks.length === 0) return;
    start(tracks, Math.floor(Math.random() * tracks.length));
  };

  return (
    <div className="relative">
      {rgb &&
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh]"
        style={{
          background: `linear-gradient(180deg, rgba(${rgb}, 0.38) 0%, rgba(3, 3, 3, 0) 100%)`
        }} />

      }

      <div className="relative mx-auto flex max-w-[1600px] flex-col gap-10 px-4 py-10 sm:px-8 lg:flex-row lg:items-start">
        {/* Header column: fixed, sized to its own content. */}
        <header className="w-full shrink-0 lg:sticky lg:top-24 lg:w-[300px]">
          <div className="aspect-square w-full max-w-[300px] overflow-hidden rounded-lg bg-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
            {artwork && <img src={artwork} alt="" className="h-full w-full object-cover" />}
          </div>

          <h1 className="mt-6 text-[36px] font-bold leading-[44px] text-white">
            {loading ? 'Loading…' : playlist?.title}
          </h1>
          {playlist?.subtitle &&
          <p className="mt-2 text-[14px] font-medium leading-5 text-white">{playlist.subtitle}</p>
          }
          <p className="mt-1 text-[12px] leading-4 text-white/60">
            {[`${tracks.length} songs`, runtime].filter(Boolean).join(' • ')}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => start(tracks, 0)}
              disabled={tracks.length === 0}
              className="flex h-10 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-medium leading-none text-black transition-colors duration-150 hover:bg-white/90 disabled:opacity-40">
              
              <PlayIcon className="h-[18px] w-[18px] fill-current" strokeWidth={0} />
              Play
            </button>
            <button
              type="button"
              onClick={shuffle}
              disabled={tracks.length === 0}
              className="flex h-10 items-center gap-2 rounded-full border border-white/25 px-5 text-[14px] font-medium leading-none text-white transition-colors duration-150 hover:bg-white/10 disabled:opacity-40">
              
              <ShuffleIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              Shuffle
            </button>
            <button
              type="button"
              onClick={() => {
                if (!tracks[0]) return;
                toggleWatchLater(tracks[0]);
                showToast(saved ? 'Removed from library' : 'Saved to library');
              }}
              aria-label={saved ? 'Remove from library' : 'Save to library'}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors duration-150 hover:bg-white/10">
              
              {saved ?
              <BookmarkCheckIcon className="h-[22px] w-[22px]" strokeWidth={1.8} /> :

              <BookmarkIcon className="h-[22px] w-[22px]" strokeWidth={1.8} />
              }
            </button>
            <DropdownMenu
              label="More actions"
              align="left"
              width={230}
              icon={<EllipsisVerticalIcon className="h-5 w-5" strokeWidth={1.8} />}
              triggerClassName="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors duration-150 hover:bg-white/10"
              items={[
              {
                icon: <ListPlusIcon className="h-5 w-5" strokeWidth={1.8} />,
                label: 'Add to queue',
                onSelect: () => {
                  tracks.forEach(addToQueue);
                  showToast('Added to queue');
                }
              },
              {
                icon: <ShareIcon className="h-5 w-5" strokeWidth={1.8} />,
                label: 'Share',
                onSelect: () => {
                  void navigator.clipboard.
                  writeText(window.location.href).
                  then(() => showToast('Link copied to clipboard')).
                  catch(() => showToast('Could not copy the link'));
                }
              },
              {
                icon: <YoutubeIcon className="h-5 w-5" strokeWidth={1.8} />,
                label: 'Open on YouTube',
                separated: true,
                onSelect: () => navigate(`/playlist?list=${encodeURIComponent(listId ?? '')}`)
              }]
              } />
            
          </div>
        </header>

        {/* Track column: the only part that scrolls with the page. */}
        <div className="min-w-0 flex-1">
          {loading ?
          <div className="space-y-2" aria-busy="true">
              {Array.from({ length: 10 }).map((_, index) =>
            <div key={index} className="flex animate-pulse items-center gap-3 p-2">
                  <div className="h-12 w-12 shrink-0 rounded bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/2 rounded bg-white/10" />
                    <div className="h-3 w-1/4 rounded bg-white/10" />
                  </div>
                </div>
            )}
            </div> :
          tracks.length === 0 ?
          <p className="py-16 text-center text-[14px] leading-5 text-white/60">
              This playlist has no songs yet.
            </p> :

          <ol>
              {tracks.map((track, index) =>
            <li key={`${track.id}-${index}`}>
                  <MusicTrackRow
                track={track}
                index={index}
                onPlay={() => start(tracks, index)} />
              
                </li>
            )}
            </ol>
          }
        </div>
      </div>
    </div>);

}