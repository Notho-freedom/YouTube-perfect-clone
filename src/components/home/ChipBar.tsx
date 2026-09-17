import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface ChipBarProps {
  chips: string[];
  active: string;
  onSelect: (chip: string) => void;
  /** Rendered flush right, outside the scroll area (search page "Filters" button). */
  trailing?: React.ReactNode;
  className?: string;
}

export function ChipBar({ chips, active, onSelect, trailing, className = '' }: ChipBarProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const element = scrollerRef.current;
    if (!element) return;
    setAtStart(element.scrollLeft <= 1);
    setAtEnd(element.scrollLeft + element.clientWidth >= element.scrollWidth - 1);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [sync]);

  const scrollBy = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * 360, behavior: 'smooth' });
  };

  return (
    <div className={`sticky top-14 z-20 flex items-center bg-yt-bg px-4 sm:px-6 ${className}`} style={{ borderTopWidth: "0px", borderRightWidth: "0px", borderBottomWidth: "0px", borderLeftWidth: "0px" }}>
      <div className="relative flex min-w-0 flex-1 items-center">
        {!atStart && <>
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-yt-bg to-transparent" />
            <button type="button" onClick={() => scrollBy(-1)} aria-label="Previous topics" className="absolute left-0 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-yt-bg text-yt-text transition-colors duration-150 hover:bg-yt-chip">
              <ChevronLeftIcon className="h-6 w-6" strokeWidth={1.8} />
            </button>
          </>}

        <div ref={scrollerRef} onScroll={sync} className="no-scrollbar flex min-w-0 flex-1 items-center gap-3 overflow-x-auto py-3">
          {chips.map((chip) => {
            const isActive = chip === active;
            return <button key={chip} type="button" onClick={() => onSelect(chip)} aria-pressed={isActive} className={`flex h-8 shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-[14px] font-medium leading-none transition-colors duration-150 ${isActive ? 'bg-yt-inverse text-yt-inverseText' : 'bg-yt-chip text-yt-text hover:bg-yt-chipHover'}`}>
                {chip}
              </button>;
          })}
        </div>

        {!atEnd && <>
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-yt-bg to-transparent" />
            <button type="button" onClick={() => scrollBy(1)} aria-label="Next topics" className="absolute right-0 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-yt-bg text-yt-text transition-colors duration-150 hover:bg-yt-chip">
              <ChevronRightIcon className="h-6 w-6" strokeWidth={1.8} />
            </button>
          </>}
      </div>

      {trailing && <div className="ml-6 shrink-0">{trailing}</div>}
    </div>);

}