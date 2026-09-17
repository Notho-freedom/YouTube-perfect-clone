import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import type { Video } from '../../types/youtube';
import { useTasteSignals } from '../../hooks/useMyYouTube';
import { buildRelatedFilters } from '../../utils/recommendations';
import { CompactVideoCard } from '../video/CompactVideoCard';
import { CompactVideoSkeleton } from '../video/Skeletons';

interface RelatedPanelProps {
  videos: Video[];
  loading: boolean;
  /** The video being watched — the filters are derived from it. */
  current?: Video;
  /** Theater mode moves the panel under the player as a wide grid. */
  stacked?: boolean;
}

export function RelatedPanel({ videos, loading, current, stacked = false }: RelatedPanelProps) {
  const signals = useTasteSignals();
  const [active, setActive] = useState('All');
  const scroller = useRef<HTMLDivElement>(null);

  const filters = useMemo(
    () => buildRelatedFilters(current, videos, signals),
    // `signals` is rebuilt every render, so key off its size instead of its
    // identity — otherwise the filters (and the reset below) would churn.
    [current?.id, videos, signals.subscriptions.length, signals.history.length]
  );

  const labels = filters.map((filter) => filter.label).join('|');

  // A filter can disappear when the video changes; fall back to All.
  useEffect(() => {
    setActive((current) => labels.split('|').includes(current) ? current : 'All');
  }, [labels]);

  const visible = useMemo(() => {
    const filter = filters.find((item) => item.label === active);
    const result = filter ? videos.filter(filter.predicate) : videos;
    // Never blank the rail out: a filter that suddenly matches nothing falls
    // back to the full list rather than an empty column.
    return result.length > 0 ? result : videos;
  }, [filters, active, videos]);

  return (
    <aside className="w-full" aria-label="Related videos">
      {/* The filter row is pinned to the top of the rail and the list slides
           underneath it, so the filters are always reachable. */}
      {filters.length > 1 &&
      <div
        className={`relative mb-3 ${
        stacked ? '' : 'yt-header sticky top-0 z-40 -mt-1 pb-2 pt-1'}`
        }>
        
          <div ref={scroller} className="no-scrollbar flex gap-3 overflow-x-auto pr-10">
            {filters.map((filter) =>
          <button
            key={filter.label}
            type="button"
            onClick={() => setActive(filter.label)}
            aria-pressed={filter.label === active}
            className={`flex h-8 max-w-[220px] shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-[14px] font-medium leading-none transition-colors duration-150 ${
            filter.label === active ?
            'bg-yt-inverse text-yt-inverseText' :
            'bg-yt-chip text-yt-text hover:bg-yt-chipHover'}`
            }>
            
                <span className="truncate">{filter.label}</span>
              </button>
          )}
          </div>

          {/* The chip row is now long enough to need pushing, so it gets the
             same arrow YouTube uses on its own chip bars. */}
          <button
          type="button"
          onClick={() =>
          scroller.current?.scrollBy({ left: 200, behavior: 'smooth' })
          }
          aria-label="More filters"
          className="yt-header absolute right-0 top-1 flex h-8 w-8 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
          
            <ChevronRightIcon className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      }

      <div
        className={stacked ? 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3' : 'space-y-2'}>
        
        {loading ?
        Array.from({ length: 8 }).map((_, index) => <CompactVideoSkeleton key={index} />) :
        visible.map((video) => <CompactVideoCard key={video.id} video={video} />)}
      </div>
    </aside>);

}