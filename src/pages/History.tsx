import React, { useMemo, useState } from 'react';
import { PauseIcon, SearchIcon, SettingsIcon, Trash2Icon, XIcon } from 'lucide-react';
import { SearchResultCard } from '../components/video/SearchResultCard';
import { useLibrary } from '../contexts/LibraryContext';
import type { HistoryEntry } from '../types/youtube';

function dayLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

const SIDE_BUTTON =
'flex h-10 w-full items-center gap-4 rounded-full px-4 text-left text-[14px] font-medium leading-none text-yt-text transition-colors duration-150 hover:bg-yt-hover';

export function History() {
  const { history, removeFromHistory, clearHistory } = useLibrary();
  const [filter, setFilter] = useState('');

  const groups = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const filtered = needle ?
    history.filter(
      (entry) =>
      entry.video.title.toLowerCase().includes(needle) ||
      entry.video.channelTitle.toLowerCase().includes(needle)
    ) :
    history;

    const map = new Map<string, HistoryEntry[]>();
    filtered.forEach((entry) => {
      const label = dayLabel(entry.watchedAt);
      map.set(label, [...(map.get(label) ?? []), entry]);
    });
    return Array.from(map.entries());
  }, [history, filter]);

  return (
    <div className="mx-auto flex w-full max-w-[1300px] flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:flex-row">
      <div className="min-w-0 flex-1">
        <h1 className="mb-6 text-[24px] font-bold leading-8 text-yt-text">Watch history</h1>

        {history.length === 0 &&
        <p className="max-w-[560px] text-[14px] leading-5 text-yt-sub">
            Videos you watch in this clone are collected here. The YouTube Data API no longer
            exposes your real watch history, so this list is built locally as you browse.
          </p>
        }

        {groups.map(([label, entries]) =>
        <section key={label} className="mb-8">
            <h2 className="mb-4 border-b border-yt-border pb-2 text-[20px] font-bold leading-7 text-yt-text">
              {label}
            </h2>
            <div className="space-y-4">
              {entries.map((entry) =>
            <div key={`${entry.video.id}-${entry.watchedAt}`} className="relative pr-10">
                  <SearchResultCard
                video={entry.video}
                onRemoveFromHistory={() => removeFromHistory(entry.video.id)} />
              
                  <button
                type="button"
                onClick={() => removeFromHistory(entry.video.id)}
                aria-label={`Remove ${entry.video.title} from watch history`}
                className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
                
                    <XIcon className="h-5 w-5" strokeWidth={1.8} />
                  </button>
                </div>
            )}
            </div>
          </section>
        )}
      </div>

      <aside className="w-full shrink-0 lg:w-[360px]">
        <div className="mb-4 flex h-10 items-center gap-3 border-b border-yt-border px-2">
          <SearchIcon className="h-5 w-5 shrink-0 text-yt-text" strokeWidth={1.8} />
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            type="text"
            placeholder="Search watch history"
            aria-label="Search watch history"
            className="h-full w-full bg-transparent text-[14px] text-yt-text outline-none placeholder:text-yt-sub" />
          
        </div>

        <button type="button" onClick={clearHistory} className={SIDE_BUTTON}>
          <Trash2Icon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
          Clear all watch history
        </button>
        <button type="button" className={SIDE_BUTTON}>
          <PauseIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
          Pause watch history
        </button>
        <button type="button" className={SIDE_BUTTON}>
          <SettingsIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
          Manage all history
        </button>
      </aside>
    </div>);

}