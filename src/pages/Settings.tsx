import React from 'react';
import {
  DatabaseZapIcon,
  GaugeIcon,
  LanguagesIcon,
  LogOutIcon,
  MoonIcon,
  SearchXIcon,
  ServerIcon,
  SunIcon,
  Trash2Icon } from
'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useLibrary } from '../contexts/LibraryContext';
import { useToast } from '../contexts/ToastContext';
import { ChannelAvatar } from '../components/video/ChannelAvatar';
import { cacheClear } from '../utils/cache';
import { quotaSnapshot } from '../utils/quota';
import { isProxyActive } from '../utils/youtubeApi';
import { upstashEnabled } from '../utils/upstash';

const ROW =
'flex w-full items-center justify-between gap-6 border-b border-yt-border py-4 text-left last:border-0';
const ACTION =
'flex h-9 shrink-0 items-center gap-2 rounded-full bg-yt-chip px-4 text-[14px] font-medium leading-none text-yt-text transition-colors duration-150 hover:bg-yt-chipHover';

export function Settings() {
  const { theme, toggleTheme, locale, setLocale } = useApp();
  const { signedIn, user, signOut } = useAuth();
  const { history, watchLater, searchHistory, clearHistory, clearWatchLater, clearSearchHistory } =
  useLibrary();
  const { showToast } = useToast();
  const quota = quotaSnapshot();

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pb-16 pt-6 sm:px-6">
      <h1 className="mb-8 text-[24px] font-bold leading-8 text-yt-text">Settings</h1>

      <section className="mb-10">
        <h2 className="mb-2 text-[16px] font-medium leading-[22px] text-yt-text">Account</h2>
        {signedIn ?
        <div className={ROW}>
            <div className="flex min-w-0 items-center gap-3">
              <ChannelAvatar
              name={user?.user_metadata?.full_name as string | undefined ?? user?.email ?? 'You'}
              src={user?.user_metadata?.avatar_url as string | undefined}
              size={40} />
            
              <div className="min-w-0">
                <p className="truncate text-[14px] leading-5 text-yt-text">
                  {user?.user_metadata?.full_name as string | undefined ?? 'Signed in'}
                </p>
                <p className="truncate text-[12px] leading-[18px] text-yt-sub">{user?.email}</p>
              </div>
            </div>
            <button type="button" onClick={() => void signOut()} className={ACTION}>
              <LogOutIcon className="h-4 w-4" strokeWidth={2} />
              Sign out
            </button>
          </div> :

        <p className="border-b border-yt-border py-4 text-[14px] leading-5 text-yt-sub">
            You are browsing signed out. Sign in from the masthead to load your YouTube account.
          </p>
        }
      </section>

      <section className="mb-10">
        <h2 className="mb-2 text-[16px] font-medium leading-[22px] text-yt-text">Appearance</h2>
        <div className={ROW}>
          <div>
            <p className="text-[14px] leading-5 text-yt-text">Theme</p>
            <p className="text-[12px] leading-[18px] text-yt-sub">
              Dark and light use YouTube's own palettes.
            </p>
          </div>
          <button type="button" onClick={toggleTheme} className={ACTION}>
            {theme === 'dark' ?
            <MoonIcon className="h-4 w-4" strokeWidth={1.8} /> :

            <SunIcon className="h-4 w-4" strokeWidth={1.8} />
            }
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>

        <div className={ROW}>
          <div>
            <p className="text-[14px] leading-5 text-yt-text">Language</p>
            <p className="text-[12px] leading-[18px] text-yt-sub">
              Applies to view counts, dates and relative times.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-yt-chip p-1">
            {(
            [
            ['en', 'English'],
            ['fr', 'Français']] as
            const).
            map(([code, name]) =>
            <button
              key={code}
              type="button"
              onClick={() => {
                setLocale(code);
                showToast(code === 'fr' ? 'Langue : Français' : 'Language: English');
              }}
              aria-pressed={locale === code}
              className={`flex h-8 items-center gap-2 rounded-full px-4 text-[14px] font-medium leading-none transition-colors duration-150 ${
              locale === code ?
              'bg-yt-text text-yt-bg' :
              'text-yt-text hover:bg-yt-chipHover'}`
              }>
              
                <LanguagesIcon className="h-4 w-4" strokeWidth={1.8} />
                {name}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 text-[16px] font-medium leading-[22px] text-yt-text">
          Your data in this clone
        </h2>
        <div className={ROW}>
          <div>
            <p className="text-[14px] leading-5 text-yt-text">Watch history</p>
            <p className="text-[12px] leading-[18px] text-yt-sub">
              {history.length} videos — stored in this browser, since the API cannot read YouTube
              history.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearHistory();
              showToast('Watch history cleared');
            }}
            className={ACTION}>
            
            <Trash2Icon className="h-4 w-4" strokeWidth={1.8} />
            Clear
          </button>
        </div>

        <div className={ROW}>
          <div>
            <p className="text-[14px] leading-5 text-yt-text">Watch later</p>
            <p className="text-[12px] leading-[18px] text-yt-sub">{watchLater.length} videos</p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearWatchLater();
              showToast('Watch later cleared');
            }}
            className={ACTION}>
            
            <Trash2Icon className="h-4 w-4" strokeWidth={1.8} />
            Clear
          </button>
        </div>

        <div className={ROW}>
          <div>
            <p className="text-[14px] leading-5 text-yt-text">Search history</p>
            <p className="text-[12px] leading-[18px] text-yt-sub">
              {searchHistory.length} queries used by the autocomplete
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearSearchHistory();
              showToast('Search history cleared');
            }}
            className={ACTION}>
            
            <SearchXIcon className="h-4 w-4" strokeWidth={1.8} />
            Clear
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[16px] font-medium leading-[22px] text-yt-text">API and cache</h2>
        <div className={ROW}>
          <div className="flex min-w-0 items-start gap-3">
            <ServerIcon className="mt-0.5 h-5 w-5 shrink-0 text-yt-sub" strokeWidth={1.8} />
            <div>
              <p className="text-[14px] leading-5 text-yt-text">Edge Function proxy</p>
              <p className="text-[12px] leading-[18px] text-yt-sub">
                {isProxyActive() ?
                'Active — reads go through yt-proxy, so the API key stays server-side.' :
                'Inactive — the app is calling the YouTube API directly from the browser.'}
              </p>
            </div>
          </div>
        </div>

        <div className={ROW}>
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <GaugeIcon className="mt-0.5 h-5 w-5 shrink-0 text-yt-sub" strokeWidth={1.8} />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] leading-5 text-yt-text">Daily API quota</p>
              <p className="text-[12px] leading-[18px] text-yt-sub">
                {quota.spent.toLocaleString()} of {quota.limit.toLocaleString()} units used today
                {' · '}
                search {quota.searchSpent.toLocaleString()}/{quota.searchLimit.toLocaleString()}
                {quota.refused > 0 && ` · ${quota.refused} calls held back`}
              </p>
              <div
                className="mt-2 h-1 w-full max-w-[320px] overflow-hidden rounded-full bg-yt-chip"
                role="progressbar"
                aria-valuenow={Math.round(quota.ratio * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Daily API quota used">
                
                <div
                  className={`h-full rounded-full ${
                  quota.ratio > 0.85 ? 'bg-[#ff0000]' : 'bg-yt-text'}`
                  }
                  style={{ width: `${Math.max(2, quota.ratio * 100)}%` }} />
                
              </div>
            </div>
          </div>
        </div>

        <div className={ROW}>
          <div className="flex min-w-0 items-start gap-3">
            <DatabaseZapIcon className="mt-0.5 h-5 w-5 shrink-0 text-yt-sub" strokeWidth={1.8} />
            <div>
              <p className="text-[14px] leading-5 text-yt-text">Shared Redis cache</p>
              <p className="text-[12px] leading-[18px] text-yt-sub">
                {upstashEnabled ?
                'Upstash connected — public responses are shared across sessions.' :
                'Local cache only.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              cacheClear();
              showToast('Cached API responses cleared');
            }}
            className={ACTION}>
            
            <Trash2Icon className="h-4 w-4" strokeWidth={1.8} />
            Clear cache
          </button>
        </div>
      </section>
    </div>);

}