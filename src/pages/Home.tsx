import React, { useMemo, useState } from 'react';
import { ChipBar } from '../components/home/ChipBar';
import { EmptyState } from '../components/ui/EmptyState';
import { ShortsShelf } from '../components/shorts/ShortsShelf';
import { PlaylistCard } from '../components/video/PlaylistCard';
import { VideoGrid } from '../components/video/VideoGrid';
import { homeChips } from '../data/chips';
import { useGridColumns } from '../hooks/useGridColumns';
import { useTasteSignals } from '../hooks/useMyYouTube';
import { useHomeFeed } from '../hooks/useYouTube';
import type { PlaylistSummary } from '../types/youtube';
import { durationToSeconds } from '../utils/format';
import { buildMixes } from '../utils/mixes';
import { buildDynamicChips } from '../utils/recommendations';

export function Home() {
  const [chip, setChip] = useState('All');
  const signals = useTasteSignals();
  const { videos, shorts, loading, failed } = useHomeFeed(chip, signals);
  const columns = useGridColumns();

  const chips = useMemo(
    () => buildDynamicChips(signals, videos.slice(0, 12), homeChips),
    [signals, videos]
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

  /**
   * "Keep watching": YouTube surfaces a video you started and abandoned right
   * at the top of the feed, not buried in history. Anything past ~8 seconds
   * and below 92% counts as unfinished; a video with no known duration needs a
   * full minute watched before it qualifies, so a mis-click never shows up.
   */
  const resume = useMemo(() => {
    const seconds = signals.watchSeconds ?? {};
    const seen = new Set<string>();
    return signals.history.
    filter((entry) => {
      if (seen.has(entry.video.id)) return false;
      const watched = seconds[entry.video.id] ?? 0;
      const total = durationToSeconds(entry.video.duration);
      if (watched < 8) return false;
      if (total === 0) return watched >= 60;
      if (watched / total > 0.92) return false;
      seen.add(entry.video.id);
      return true;
    }).
    sort((a, b) => b.watchedAt - a.watchedAt).
    slice(0, columns).
    map((entry) => entry.video);
  }, [signals.history, signals.watchSeconds, columns]);

  // The Shorts shelf always follows a complete row, exactly like YouTube.
  const splitAt = columns * 2;
  const leading = videos.slice(0, splitAt);
  const trailing = videos.slice(splitAt);

  return (
    <>
      <ChipBar chips={chips} active={chip} onSelect={setChip} />

      <div className="px-4 pb-16 pt-1 sm:px-6">
        {loading ?
        <VideoGrid videos={[]} loading skeletonCount={columns * 3} /> :
        videos.length === 0 ?
        <EmptyState
          art={failed ? 'error' : 'library'}
          title={
          failed ?
          'Something went wrong' :
          chip === 'All' ?
          'No videos to show right now' :
          `Nothing under “${chip}” right now`
          }
          description={
          failed ?
          'Your feed could not be loaded. The daily API quota may be used up — it resets at midnight Pacific Time.' :
          'Try another topic, or come back a little later.'
          }
          action={
          chip !== 'All' ?
          <button
            type="button"
            onClick={() => setChip('All')}
            className="flex h-9 items-center rounded-full bg-yt-inverse px-4 text-[14px] font-medium leading-none text-yt-inverseText transition-opacity duration-150 hover:opacity-90">
            
                  Show all
                </button> :
          undefined
          } /> :


        <>
            {resume.length > 0 && chip === 'All' &&
          <section className="mb-10" aria-label="Keep watching">
                <h2 className="mb-4 text-[20px] font-bold leading-7 text-yt-text">
                  Keep watching
                </h2>
                <VideoGrid videos={resume} />
              </section>
          }

            <VideoGrid videos={leading} />

            {shorts.length > 0 &&
          <div className="my-6">
                <ShortsShelf shorts={shorts} />
              </div>
          }

            {mixes.length > 0 && chip === 'All' &&
          <section className="my-8" aria-label="Mixes for you">
                <h2 className="mb-4 text-[20px] font-bold leading-7 text-yt-text">
                  Mixes for you
                </h2>
                <div className="no-scrollbar -mx-2 flex gap-2 overflow-x-auto px-2 pb-1">
                  {mixes.map((mix) =>
              <div key={mix.id} className="w-[280px] shrink-0">
                      <PlaylistCard playlist={mix} />
                    </div>
              )}
                </div>
              </section>
          }

            {trailing.length > 0 &&
          <div className="mt-10">
                <VideoGrid videos={trailing} />
              </div>
          }
          </>
        }
      </div>
    </>);

}