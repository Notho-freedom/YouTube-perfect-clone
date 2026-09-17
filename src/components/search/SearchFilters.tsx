import React from 'react';
import { XIcon } from 'lucide-react';
import type { Video } from '../../types/youtube';
import { durationToSeconds } from '../../utils/format';

export interface SearchFilterState {
  uploadDate: 'Any time' | 'Today' | 'This week' | 'This month' | 'This year';
  duration: 'Any' | 'Under 4 minutes' | '4 – 20 minutes' | 'Over 20 minutes';
  features: 'Any' | 'Live' | 'Shorts';
  sortBy: 'Relevance' | 'Upload date' | 'View count';
}

export const defaultSearchFilters: SearchFilterState = {
  uploadDate: 'Any time',
  duration: 'Any',
  features: 'Any',
  sortBy: 'Relevance'
};

const GROUPS: Array<{
  title: string;
  key: keyof SearchFilterState;
  options: string[];
}> = [
{
  title: 'Upload date',
  key: 'uploadDate',
  options: ['Any time', 'Today', 'This week', 'This month', 'This year']
},
{
  title: 'Duration',
  key: 'duration',
  options: ['Any', 'Under 4 minutes', '4 – 20 minutes', 'Over 20 minutes']
},
{ title: 'Features', key: 'features', options: ['Any', 'Live', 'Shorts'] },
{ title: 'Sort by', key: 'sortBy', options: ['Relevance', 'Upload date', 'View count'] }];


const WINDOWS: Record<SearchFilterState['uploadDate'], number> = {
  'Any time': Infinity,
  Today: 1,
  'This week': 7,
  'This month': 31,
  'This year': 365
};

/**
 * Applied to results already in hand rather than re-querying: search costs
 * 100 quota units per call, so re-running it on every filter change would
 * drain the daily allowance in a couple of minutes.
 */
export function applySearchFilters(videos: Video[], filters: SearchFilterState): Video[] {
  const maxAgeDays = WINDOWS[filters.uploadDate];

  const filtered = videos.filter((video) => {
    if (maxAgeDays !== Infinity) {
      const published = new Date(video.publishedAt).getTime();
      if (Number.isNaN(published)) return false;
      if ((Date.now() - published) / 86_400_000 > maxAgeDays) return false;
    }

    const seconds = durationToSeconds(video.duration);
    if (filters.duration === 'Under 4 minutes' && !(seconds > 0 && seconds < 240)) return false;
    if (filters.duration === '4 – 20 minutes' && !(seconds >= 240 && seconds <= 1200)) return false;
    if (filters.duration === 'Over 20 minutes' && !(seconds > 1200)) return false;

    if (filters.features === 'Live' && !video.isLive) return false;
    if (filters.features === 'Shorts' && !(seconds > 0 && seconds <= 60)) return false;

    return true;
  });

  if (filters.sortBy === 'Upload date') {
    return [...filtered].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }
  if (filters.sortBy === 'View count') {
    return [...filtered].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
  }
  return filtered;
}

export function countActiveFilters(filters: SearchFilterState): number {
  return (Object.keys(filters) as Array<keyof SearchFilterState>).filter(
    (key) => filters[key] !== defaultSearchFilters[key]
  ).length;
}

interface SearchFiltersProps {
  filters: SearchFilterState;
  onChange: (filters: SearchFilterState) => void;
  onClose: () => void;
}

export function SearchFilters({ filters, onChange, onClose }: SearchFiltersProps) {
  const active = countActiveFilters(filters);

  return (
    <section
      aria-label="Search filters"
      className="border-b border-yt-border px-4 py-6 sm:px-6">
      
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {GROUPS.map((group) =>
        <div key={group.key}>
            <h3 className="mb-3 border-b border-yt-border pb-2 text-[14px] font-medium leading-5 text-yt-text">
              {group.title}
            </h3>
            <ul className="space-y-2">
              {group.options.map((option) => {
              const selected = filters[group.key] === option;
              return (
                <li key={option}>
                    <button
                    type="button"
                    onClick={() =>
                    onChange({ ...filters, [group.key]: option } as SearchFilterState)
                    }
                    aria-pressed={selected}
                    className={`text-left text-[13px] leading-5 transition-colors duration-150 ${
                    selected ? 'font-medium text-yt-text' : 'text-yt-sub hover:text-yt-text'}`
                    }>
                    
                      {option}
                    </button>
                  </li>);

            })}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-4">
        {active > 0 &&
        <button
          type="button"
          onClick={() => onChange(defaultSearchFilters)}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-yt-chip px-3 text-[13px] font-medium leading-none text-yt-text transition-colors duration-150 hover:bg-yt-chipHover">
          
            <XIcon className="h-4 w-4" strokeWidth={2} />
            Clear {active} filter{active > 1 ? 's' : ''}
          </button>
        }
        <button
          type="button"
          onClick={onClose}
          className="text-[13px] font-medium leading-none text-yt-sub transition-colors duration-150 hover:text-yt-text">
          
          Hide filters
        </button>
      </div>
    </section>);

}