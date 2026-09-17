import React, { useEffect } from 'react';
import { XIcon } from 'lucide-react';

interface KeyboardShortcutsProps {
  onClose: () => void;
}

/** Only shortcuts this clone actually implements are listed. */
const GROUPS: Array<{title: string;rows: Array<[string, string]>;}> = [
{
  title: 'Playback',
  rows: [
  ['k / space', 'Play or pause'],
  ['m', 'Mute'],
  ['t', 'Cinema mode'],
  ['i', 'Miniplayer']]

},
{
  title: 'Shorts',
  rows: [
  ['↓', 'Next Short'],
  ['↑', 'Previous Short']]

},
{
  title: 'General',
  rows: [
  ['/', 'Focus search'],
  ['Esc', 'Close this dialog']]

}];


export function KeyboardShortcuts({ onClose }: KeyboardShortcutsProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}>
      
      <div
        onClick={(event) => event.stopPropagation()}
        className="max-h-[80vh] w-[min(560px,100%)] overflow-y-auto rounded-xl bg-yt-elevated p-6 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
        
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="text-[20px] font-medium leading-7 text-yt-text">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
            
            <XIcon className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>

        <div className="space-y-6">
          {GROUPS.map((group) =>
          <section key={group.title}>
              <h3 className="mb-3 border-b border-yt-border pb-2 text-[14px] font-medium leading-5 text-yt-text">
                {group.title}
              </h3>
              <dl className="space-y-2">
                {group.rows.map(([keys, action]) =>
              <div key={keys} className="flex items-center justify-between gap-6">
                    <dt className="text-[14px] leading-5 text-yt-sub">{action}</dt>
                    <dd>
                      <kbd className="rounded bg-yt-chip px-2 py-1 text-[12px] font-medium leading-none text-yt-text">
                        {keys}
                      </kbd>
                    </dd>
                  </div>
              )}
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>);

}