import React from 'react';
import { ClockIcon, SearchIcon } from 'lucide-react';

export interface Suggestion {
  text: string;
  fromHistory: boolean;
}

interface SearchSuggestionsProps {
  query: string;
  suggestions: Suggestion[];
  activeIndex: number;
  onSelect: (value: string) => void;
  onRemoveHistory: (value: string) => void;
  onHover: (index: number) => void;
}

export function SearchSuggestions({
  query,
  suggestions,
  activeIndex,
  onSelect,
  onRemoveHistory,
  onHover
}: SearchSuggestionsProps) {
  if (suggestions.length === 0) return null;

  const typed = query.trim().toLowerCase();

  return (
    <div
      role="listbox"
      className="absolute left-0 right-0 top-[46px] z-50 overflow-hidden rounded-xl bg-yt-elevated py-2 shadow-[0_4px_32px_rgba(0,0,0,0.2)] ring-1 ring-black/5 sm:right-[68px] dark:ring-white/10">
      
      {suggestions.map((suggestion, index) => {
        const lower = suggestion.text.toLowerCase();
        const matches = typed.length > 0 && lower.startsWith(typed);
        const head = matches ? suggestion.text.slice(0, typed.length) : '';
        const tail = matches ? suggestion.text.slice(typed.length) : suggestion.text;

        return (
          <div
            key={`${suggestion.text}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            onMouseEnter={() => onHover(index)}
            className={`group flex h-10 cursor-default items-center gap-4 px-4 ${
            index === activeIndex ? 'bg-yt-hover' : ''}`
            }>
            
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(suggestion.text);
              }}
              className="flex min-w-0 flex-1 items-center gap-4 text-left">
              
              {suggestion.fromHistory ?
              <ClockIcon className="h-5 w-5 shrink-0 text-yt-sub" strokeWidth={1.8} /> :

              <SearchIcon className="h-5 w-5 shrink-0 text-yt-text" strokeWidth={1.8} />
              }
              <span className="truncate text-[16px] leading-5 text-yt-text">
                {head}
                <span className="font-bold">{tail}</span>
              </span>
            </button>

            {suggestion.fromHistory &&
            <button
              type="button"
              aria-label={`Remove ${suggestion.text} from search history`}
              onMouseDown={(event) => {
                event.preventDefault();
                onRemoveHistory(suggestion.text);
              }}
              className="shrink-0 rounded-full px-1 text-[12px] font-medium leading-none text-yt-blue opacity-0 transition-opacity duration-150 ease-out focus-visible:opacity-100 group-hover:opacity-100">
              
                Remove
              </button>
            }
          </div>);

      })}

      <p className="px-4 pt-2 text-right text-[12px] leading-[18px] text-yt-sub">
        Report search predictions
      </p>
    </div>);

}