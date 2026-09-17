import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from 'lucide-react';
import { ChannelAvatar } from '../video/ChannelAvatar';

interface MusicShelfProps {
  title: string;
  /** Small label above the title, e.g. an account name or "RADIO". */
  eyebrow?: string;
  /** Avatar shown beside the eyebrow, like Music's personalised shelves. */
  eyebrowAvatar?: string;
  /** Renders Music's "Play all" pill on the right of the header. */
  onPlayAll?: () => void;
  /** Destination for Music's "More" pill. */
  moreTo?: string;
  children: React.ReactNode;
}

/**
 * A YouTube Music carousel: eyebrow, large title, optional "Play all", and
 * arrow buttons that page through the row. The arrows only exist on pointer
 * devices; the row stays swipeable everywhere.
 */
export function MusicShelf({
  title,
  eyebrow,
  eyebrowAvatar,
  onPlayAll,
  moreTo,
  children
}: MusicShelfProps) {
  const railRef = useRef<HTMLDivElement>(null);

  const page = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className="mt-10 first:mt-0">
      <div className="mb-4 flex items-end justify-between gap-4 px-6 lg:px-12">
        <div className="min-w-0">
          {eyebrow &&
          <div className="mb-1 flex items-center gap-2">
              {eyebrowAvatar && <ChannelAvatar name={eyebrow} src={eyebrowAvatar} size={20} />}
              <p className="truncate text-[12px] font-medium uppercase tracking-wide text-white/60">
                {eyebrow}
              </p>
            </div>
          }
          <h2 className="truncate text-[28px] font-bold leading-9 tracking-tight text-white">
            {title}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onPlayAll &&
          <button
            type="button"
            onClick={onPlayAll}
            className="flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-4 text-[12px] font-medium leading-none text-white transition-colors duration-150 hover:bg-white/20">
            
              <PlayIcon className="h-4 w-4 fill-current" strokeWidth={0} />
              Play all
            </button>
          }
          {moreTo &&
          <Link
            to={moreTo}
            className="flex h-8 items-center rounded-full bg-white/10 px-4 text-[12px] font-medium leading-none text-white transition-colors duration-150 hover:bg-white/20">
            
              More
            </Link>
          }
          <button
            type="button"
            onClick={() => page(-1)}
            aria-label="Scroll left"
            className="hidden h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-150 hover:bg-white/20 md:flex">
            
            <ChevronLeftIcon className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            aria-label="Scroll right"
            className="hidden h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-150 hover:bg-white/20 md:flex">
            
            <ChevronRightIcon className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div ref={railRef} className="no-scrollbar flex gap-4 overflow-x-auto px-6 pb-2 lg:px-12">
        {children}
      </div>
    </section>);

}