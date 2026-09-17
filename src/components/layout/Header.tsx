import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CircleUserRoundIcon,
  MicIcon,
  PencilLineIcon,
  RadioIcon,
  SearchIcon,
  UploadIcon,
  XIcon,
  YoutubeIcon } from
'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { useToast } from '../../contexts/ToastContext';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';
import { fetchSuggestions } from '../../utils/suggest';
import { DropdownMenu } from '../ui/DropdownMenu';
import { Tooltip } from '../ui/Tooltip';
import { NavigationProgress } from './NavigationProgress';
import { YouTubeLogo } from '../icons/YouTubeLogo';
import { AccountMenu } from './AccountMenu';
import { HeaderMenu } from './HeaderMenu';
import { NotificationsPanel } from './NotificationsPanel';
import { SearchSuggestions, type Suggestion } from './SearchSuggestions';

interface HeaderProps {
  onToggleGuide: () => void;
}

export function Header({ onToggleGuide }: HeaderProps) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signedIn, signInWithGoogle } = useAuth();
  const { searchHistory, recordSearch, removeSearch } = useLibrary();
  const { showToast } = useToast();

  const urlQuery = params.get('search_query') ?? '';
  const [query, setQuery] = useState(urlQuery);
  const [focused, setFocused] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [remote, setRemote] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  // "/" focuses search, as on YouTube.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key !== '/') return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!focused || trimmed.length === 0) {
      setRemote([]);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      fetchSuggestions(trimmed).
      then((items) => {
        if (active) setRemote(items);
      }).
      catch(() => {
        if (active) setRemote([]);
      });
    }, 160);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, focused]);

  const suggestions = useMemo<Suggestion[]>(() => {
    const trimmed = query.trim().toLowerCase();
    const history = searchHistory.
    filter((item) => trimmed ? item.toLowerCase().startsWith(trimmed) : true).
    slice(0, trimmed ? 3 : 8).
    map((text) => ({ text, fromHistory: true }));

    const seen = new Set(history.map((item) => item.text.toLowerCase()));
    const rest = remote.
    filter((text) => !seen.has(text.toLowerCase())).
    slice(0, 12 - history.length).
    map((text) => ({ text, fromHistory: false }));

    return [...history, ...rest];
  }, [query, remote, searchHistory]);

  const runSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    recordSearch(trimmed);
    setActiveIndex(-1);
    setFocused(false);
    setMobileSearch(false);
    inputRef.current?.blur();
    navigate(`/results?search_query=${encodeURIComponent(trimmed)}`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => index <= 0 ? suggestions.length - 1 : index - 1);
    } else if (event.key === 'Escape') {
      setFocused(false);
      setActiveIndex(-1);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    runSearch(activeIndex >= 0 ? suggestions[activeIndex].text : query);
  };

  // Voice search runs the same path as typing, so history and suggestions
  // stay consistent whichever way the query arrived.
  const voice = useVoiceSearch(runSearch);

  const searchForm =
  <form onSubmit={submit} className="relative flex min-w-0 flex-1 items-center" role="search">
      <div
      className={`flex h-10 min-w-0 flex-1 items-center rounded-l-full border bg-yt-searchBg ${
      focused ? 'border-yt-blue pl-3' : 'border-yt-searchBorder pl-4'}`
      }>
      
        {focused && <SearchIcon className="mr-3 h-5 w-5 shrink-0 text-yt-sub" strokeWidth={2} />}
        <input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(-1);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        onKeyDown={onKeyDown}
        type="text"
        placeholder="Search"
        aria-label="Search"
        autoComplete="off"
        role="combobox"
        aria-expanded={focused && suggestions.length > 0}
        className="h-full w-full min-w-0 bg-transparent pr-2 text-[16px] leading-none text-yt-text outline-none placeholder:text-yt-sub" />
      
        {query.length > 0 &&
      <button
        type="button"
        onClick={() => {
          setQuery('');
          inputRef.current?.focus();
        }}
        aria-label="Clear search query"
        className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
        
            <XIcon className="h-6 w-6" strokeWidth={1.8} />
          </button>
      }
      </div>
      <button
      type="submit"
      aria-label="Search"
      className={`flex h-10 w-16 shrink-0 items-center justify-center rounded-r-full border border-l-0 bg-yt-searchBtn transition-colors duration-150 hover:bg-yt-searchBtnHover ${
      focused ? 'border-yt-blue' : 'border-yt-searchBorder'}`
      }>
      
        <SearchIcon className="h-6 w-6 text-yt-text" strokeWidth={1.8} />
      </button>

      {focused &&
    <SearchSuggestions
      query={query}
      suggestions={suggestions}
      activeIndex={activeIndex}
      onSelect={runSearch}
      onRemoveHistory={removeSearch}
      onHover={setActiveIndex} />

    }
    </form>;


  if (mobileSearch) {
    return (
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-2 bg-yt-bg px-2 sm:hidden">
        <button
          type="button"
          onClick={() => setMobileSearch(false)}
          aria-label="Close search"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
          
          <ArrowLeftIcon className="h-6 w-6" strokeWidth={1.8} />
        </button>
        {searchForm}
      </header>);

  }

  return (
    <header className="yt-header fixed inset-x-0 top-0 z-50 flex h-14 items-center px-4 sm:px-6">
      <NavigationProgress />
      <div className="flex shrink-0 items-center gap-5">
        <Tooltip label="Guide">
          <button
            type="button"
            onClick={onToggleGuide}
            aria-label="Guide"
            className="flex h-10 w-10 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
            
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
              <path d="M21 6H3V5h18v1zm0 5H3v1h18v-1zm0 6H3v1h18v-1z" />
            </svg>
          </button>
        </Tooltip>
        <Link to="/" aria-label="YouTube Home" className="flex items-center">
          <YouTubeLogo />
        </Link>
      </div>

      <div className="mx-auto hidden w-full max-w-[732px] items-center px-8 sm:flex">
        {searchForm}
        {voice.supported &&
        <Tooltip label="Search with your voice">
            <button
            type="button"
            onClick={() => voice.listening ? voice.stop() : voice.start()}
            aria-label="Search with your voice"
            aria-pressed={voice.listening}
            className={`relative ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${
            voice.listening ?
            'bg-yt-brand text-white' :
            'bg-yt-chip text-yt-text hover:bg-yt-chipHover'}`
            }>
            
              {voice.listening &&
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-ping rounded-full bg-yt-brand/40" />

            }
              <MicIcon className="relative h-5 w-5" strokeWidth={1.8} />
            </button>
          </Tooltip>
        }
      </div>

      {voice.listening &&
      <div
        role="status"
        className="fixed inset-x-0 top-14 z-50 mx-auto w-[min(560px,92vw)] rounded-xl bg-yt-elevated p-6 text-center shadow-[0_4px_32px_rgba(0,0,0,0.25)] ring-1 ring-black/5 dark:ring-white/10">
        
          <p className="text-[16px] leading-6 text-yt-text">
            {voice.transcript || 'Listening…'}
          </p>
          <button
          type="button"
          onClick={voice.stop}
          className="mt-4 h-9 rounded-full bg-yt-chip px-4 text-[14px] font-medium leading-none text-yt-text transition-colors duration-150 hover:bg-yt-chipHover">
          
            Stop
          </button>
        </div>
      }

      <div className="ml-auto flex shrink-0 items-center gap-3 pr-1 sm:ml-0 sm:pr-2">
        <button
          type="button"
          onClick={() => setMobileSearch(true)}
          aria-label="Search"
          className="flex h-10 w-10 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover sm:hidden">
          
          <SearchIcon className="h-6 w-6" strokeWidth={1.8} />
        </button>

        {signedIn ?
        <>
            <Tooltip label="Create">
              <DropdownMenu
              label="Create"
              align="right"
              width={200}
              icon={<UploadIcon className="h-6 w-6" strokeWidth={1.8} />}
              triggerClassName="flex h-10 w-10 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover"
              items={[
              {
                icon: <UploadIcon className="h-5 w-5" strokeWidth={1.8} />,
                label: 'Upload video',
                onSelect: () => showToast('Uploading needs the YouTube upload scope')
              },
              {
                icon: <RadioIcon className="h-5 w-5" strokeWidth={1.8} />,
                label: 'Go live',
                onSelect: () => showToast('Going live needs the YouTube upload scope')
              },
              {
                icon: <PencilLineIcon className="h-5 w-5" strokeWidth={1.8} />,
                label: 'Create post',
                onSelect: () => showToast('Posts need the YouTube upload scope')
              }]
              } />
            
            </Tooltip>
            <Tooltip label="Notifications">
              <NotificationsPanel />
            </Tooltip>
            <AccountMenu />
          </> :

        <>
            <HeaderMenu />
            {/* Two modes: the YouTube scope is still in Google's testing
               programme, so a visitor who isn't allow-listed signs in with
               identity only and uses the clone's own native library. */}
            <DropdownMenu
            label="Sign in"
            align="right"
            width={300}
            icon={
            <span className="flex items-center gap-1.5">
                  <CircleUserRoundIcon className="h-6 w-6" strokeWidth={1.8} />
                  Sign in
                </span>
            }
            triggerClassName="flex h-9 shrink-0 items-center rounded-full border border-yt-searchBorder pl-3 pr-4 text-[14px] font-medium leading-none text-yt-blue transition-colors duration-150 hover:bg-[rgba(6,95,212,0.1)] dark:hover:bg-[rgba(62,166,255,0.2)]"
            items={[
            {
              icon: <YoutubeIcon className="h-5 w-5" strokeWidth={1.8} />,
              label: 'Sign in with YouTube',
              trailing: <span className="text-[12px] text-yt-sub">Your real account</span>,
              onSelect: () => void signInWithGoogle('youtube')
            },
            {
              icon: <CircleUserRoundIcon className="h-5 w-5" strokeWidth={1.8} />,
              label: 'Sign in with Google only',
              trailing: <span className="text-[12px] text-yt-sub">Works for everyone</span>,
              onSelect: () => void signInWithGoogle('basic')
            }]
            } />
          
          </>
        }
      </div>
    </header>);

}