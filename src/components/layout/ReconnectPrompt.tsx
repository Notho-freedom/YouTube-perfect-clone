import React from 'react';
import { RefreshCwIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Google access tokens last one hour and cannot be refreshed from the browser,
 * so personal sections ask for a quick reconnect instead of showing nothing.
 */
export function ReconnectPrompt() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="mb-6 flex flex-col items-start gap-3 rounded-xl border border-yt-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[14px] leading-5 text-yt-text">
        Your YouTube access expired. Reconnect to load this section again.
      </p>
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-yt-inverse px-4 text-[14px] font-medium leading-none text-yt-inverseText transition-opacity duration-150 hover:opacity-90">
        
        <RefreshCwIcon className="h-4 w-4" strokeWidth={2} />
        Reconnect
      </button>
    </div>);

}