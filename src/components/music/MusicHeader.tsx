import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CastIcon, HistoryIcon, MenuIcon, SearchIcon, XIcon } from 'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext';
import { useToast } from '../../contexts/ToastContext';
import { fetchSuggestions } from '../../utils/suggest';
import { SearchSuggestions, type Suggestion } from '../layout/SearchSuggestions';
import { AccountMenu } from '../layout/AccountMenu';
import { Tooltip } from '../ui/Tooltip';

interface MusicHeaderProps {
  onToggleSidebar: () => void;
  /** True at the absolute top of the page: the ambient wash shows through. */
  transparent: boolean;
}

/**
 * YouTube Music's own masthead. It deliberately does not reuse YouTube's: the
 * logo, the search placeholder and the actions are different, and searching
 * here must stay inside Music rather than jumping to YouTube's results.
 */
export function MusicHeader({ onToggleSidebar, transparent }: MusicHeaderProps) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { searchHistory, recordSearch, removeSearch } = useLibrary();
  const { showToast } = useToast();

  const [value, setValue] = useState(params.get('q') ?? '');
  const [focused, setFocused] = useState(false);
  const [remote, setRemote] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(params.get('q') ?? '');
  }, [params]);

  useEffect(() => {
    const query = value.trim();
    if (!focused || query.length === 0) {
      setRemote([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      // Music predictions come from the same endpoint, scoped to songs.
      fetchSuggestions(query).
      then((results) => {
        if (!cancelled) setRemote(results);
      }).
      catch(() => undefined);
    }, 140);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value, focused]);

  const typed = value.trim().toLowerCase();
  const history = searchHistory.
  filter((item) => typed ? item.toLowerCase().includes(typed) : true).
  slice(0, typed ? 3 : 8);

  const suggestions: Suggestion[] = [
  ...history.map((text) => ({ text, fromHistory: true })),
  ...remote.
  filter((text) => !history.some((item) => item.toLowerCase() === text.toLowerCase())).
  slice(0, 10).
  map((text) => ({ text, fromHistory: false }))];


  const submit = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    recordSearch(trimmed);
    setFocused(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
    navigate(`/music/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <header
      className={`music-chrome fixed inset-x-0 top-0 z-50 flex h-16 items-center gap-4 px-4 transition-colors duration-200 ease-out ${
      transparent ? 'bg-transparent' : 'bg-[#030303]'}`
      }>
      
      {/* No fill behind the hamburger: Music leaves it bare. */}
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Menu"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-opacity duration-150 hover:opacity-80">
        
        <MenuIcon className="h-6 w-6" strokeWidth={1.8} />
      </button>

      <Link to="/music" aria-label="YouTube Music home" className="flex shrink-0 items-center gap-1">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yt-brand">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <span className="text-[20px] font-medium leading-none tracking-tight text-white">
          Music
        </span>
      </Link>

      {/* Music anchors search beside the logo rather than centring it. */}
      <div className="relative ml-6 w-full max-w-[480px]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit(activeIndex >= 0 ? suggestions[activeIndex].text : value);
          }}
          role="search">
          
          <div className="flex h-11 items-center gap-4 rounded-lg border border-white/[0.14] bg-[#1c1c1c] px-4 transition-colors duration-150 focus-within:border-white/30">
            <SearchIcon className="h-5 w-5 shrink-0 text-white/70" strokeWidth={1.8} />
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setActiveIndex(-1);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 120)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActiveIndex((index) => Math.max(index - 1, -1));
                } else if (event.key === 'Escape') {
                  setFocused(false);
                }
              }}
              type="text"
              placeholder="Search songs, albums, artists, podcasts"
              autoComplete="off"
              aria-label="Search YouTube Music"
              className="h-full w-full bg-transparent text-[14px] text-white outline-none placeholder:text-white/50" />
            
            {value.length > 0 &&
            <button
              type="button"
              onClick={() => {
                setValue('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="shrink-0 text-white/70 transition-colors duration-150 hover:text-white">
              
                <XIcon className="h-5 w-5" strokeWidth={1.8} />
              </button>
            }
          </div>
        </form>

        {focused &&
        <SearchSuggestions
          query={value}
          suggestions={suggestions}
          activeIndex={activeIndex}
          onSelect={submit}
          onRemoveHistory={removeSearch}
          onHover={setActiveIndex} />

        }
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Tooltip label="History">
          <Link
            to="/music/library?tab=History"
            aria-label="History"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors duration-150 hover:bg-white/10">
            
            <HistoryIcon className="h-6 w-6" strokeWidth={1.8} />
          </Link>
        </Tooltip>
        <Tooltip label="Play on TV">
          <button
            type="button"
            onClick={() => showToast('Casting needs a Google Cast device')}
            aria-label="Play on TV"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors duration-150 hover:bg-white/10">
            
            <CastIcon className="h-6 w-6" strokeWidth={1.8} />
          </button>
        </Tooltip>
        <AccountMenu />
      </div>
    </header>);

}