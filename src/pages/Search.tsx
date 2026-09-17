import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontalIcon } from 'lucide-react';
import { ChipBar } from '../components/home/ChipBar';
import { EmptyState } from '../components/ui/EmptyState';
import { ChannelResult } from '../components/search/ChannelResult';
import {
  SearchFilters,
  applySearchFilters,
  countActiveFilters,
  defaultSearchFilters,
  type SearchFilterState } from
'../components/search/SearchFilters';
import { ShortsShelf } from '../components/shorts/ShortsShelf';
import { SearchResultCard } from '../components/video/SearchResultCard';
import { SearchResultSkeleton } from '../components/video/Skeletons';
import { searchFilterChips } from '../data/chips';
import { useLibrary } from '../contexts/LibraryContext';
import { useSearchFeed } from '../hooks/useYouTube';

export function Search() {
  const [params] = useSearchParams();
  const query = params.get('search_query') ?? '';
  const [filter, setFilter] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilterState>(defaultSearchFilters);
  const { videos, shorts, channel, loading, failed } = useSearchFeed(query);
  const { history } = useLibrary();

  const activeFilters = countActiveFilters(filters);

  // The chip row and the filter panel compose: the chip narrows the category,
  // the panel refines what came back.
  const results = useMemo(() => {
    const seen = new Set(history.map((entry) => entry.video.id));
    const byChip =
    filter === 'All' ?
    videos :
    filter === 'Live' ?
    videos.filter((video) => video.isLive) :
    filter === 'Watched' ?
    videos.filter((video) => seen.has(video.id)) :
    filter === 'Unwatched' ?
    videos.filter((video) => !seen.has(video.id)) :
    filter === 'Recently uploaded' ?
    [...videos].sort(
      (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    ) :
    videos.filter((video) =>
    `${video.title} ${video.channelTitle}`.
    toLowerCase().
    includes(filter.toLowerCase())
    );
    const narrowed = applySearchFilters(byChip, filters);
    // A chip that matches nothing would blank the page; fall back to the panel
    // result so the viewer always sees why the list changed.
    return narrowed.length > 0 ? narrowed : applySearchFilters(videos, filters);
  }, [videos, filter, filters, history]);

  const filtersButton =
  <button
    type="button"
    onClick={() => setFiltersOpen((value) => !value)}
    aria-expanded={filtersOpen}
    className={`flex h-9 items-center gap-2 rounded-lg px-3 text-[14px] font-medium leading-none transition-colors duration-150 hover:bg-yt-hover ${
    activeFilters > 0 ? 'text-yt-blue' : 'text-yt-text'}`
    }>
    
      Filters
      {activeFilters > 0 &&
    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-yt-blue px-1 text-[11px] font-medium leading-none text-white">
          {activeFilters}
        </span>
    }
      <SlidersHorizontalIcon className="h-5 w-5" strokeWidth={1.8} />
    </button>;


  const firstResults = results.slice(0, 3);
  const remainingResults = results.slice(3);

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <ChipBar
        chips={searchFilterChips}
        active={filter}
        onSelect={setFilter}
        trailing={filtersButton}
        className={filtersOpen ? '' : 'border-b border-yt-border'} />
      

      {filtersOpen &&
      <SearchFilters
        filters={filters}
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)} />

      }

      <div className="px-4 pb-16 pt-6 sm:px-6">
        {loading ?
        <div className="space-y-6" aria-busy="true">
            {Array.from({ length: 6 }).map((_, index) =>
          <SearchResultSkeleton key={index} />
          )}
          </div> :
        results.length === 0 ?
        <EmptyState
          art={failed ? 'error' : 'results'}
          title={failed ? 'Something went wrong' : 'No results found'}
          description={
          failed ?
          'The search could not be run. Search is the most expensive call on the API — the daily budget may be used up, and it resets at midnight Pacific Time.' :
          'Try different keywords or remove search filters.'
          } /> :


        <div className="space-y-6">
            {firstResults.map((video) =>
          <SearchResultCard key={video.id} video={video} />
          )}

            {channel && <ChannelResult channel={channel} />}

            {shorts.length > 0 && filters.duration === 'Any' && <ShortsShelf shorts={shorts} />}

            {remainingResults.map((video) =>
          <SearchResultCard key={video.id} video={video} />
          )}
          </div>
        }
      </div>
    </div>);

}