import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, MessageSquareIcon } from 'lucide-react';

interface LiveChatProps {
  videoId: string;
  /** Premieres show "Chat replay" once the stream has finished. */
  replay?: boolean;
}

/**
 * Real live chat, served by YouTube's own `live_chat` surface.
 *
 * The Data API's `liveChatMessages` endpoint needs an OAuth scope this clone
 * does not request, and polling it would burn quota every few seconds — so
 * the embedded surface is both the accurate and the cheap choice. It only
 * renders when the host domain is allowed to embed it; otherwise the panel
 * explains why instead of showing an empty frame.
 */
export function LiveChat({ videoId, replay = false }: LiveChatProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const src = `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${host}&dark_theme=1`;

  return (
    <section
      aria-label={replay ? 'Chat replay' : 'Live chat'}
      className="mb-4 overflow-hidden rounded-xl border border-yt-border">
      
      <header className="flex h-12 items-center gap-3 px-4">
        <MessageSquareIcon className="h-5 w-5 shrink-0 text-yt-text" strokeWidth={1.8} />
        <h2 className="flex-1 truncate text-[14px] font-medium leading-5 text-yt-text">
          {replay ? 'Chat replay' : 'Live chat'}
        </h2>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Show chat' : 'Hide chat'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
          
          {collapsed ?
          <ChevronDownIcon className="h-5 w-5" strokeWidth={1.8} /> :

          <ChevronUpIcon className="h-5 w-5" strokeWidth={1.8} />
          }
        </button>
      </header>

      {!collapsed && (
      blocked ?
      <p className="border-t border-yt-border px-4 py-8 text-center text-[13px] leading-5 text-yt-sub">
            This stream’s chat can’t be embedded on this domain.
          </p> :

      <iframe
        key={videoId}
        src={src}
        title={replay ? 'Chat replay' : 'Live chat'}
        onError={() => setBlocked(true)}
        className="h-[480px] w-full border-0 border-t border-yt-border bg-yt-bg" />)

      }
    </section>);

}