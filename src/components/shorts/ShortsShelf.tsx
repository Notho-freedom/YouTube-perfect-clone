import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShortsColumns } from '../../hooks/useGridColumns';
import type { Video } from '../../types/youtube';
import { compact } from '../../utils/format';
import { ShortsIcon } from '../icons/ShortsIcon';
import { HoverGlow } from '../video/HoverGlow';
import { HoverPreview } from '../video/HoverPreview';
import { VideoMenuButton } from '../video/VideoMenuButton';

const SHORTS_GRID_CLASS =
'grid grid-cols-2 gap-4 xs:grid-cols-3 lg:grid-cols-5 3xl:grid-cols-6 4xl:grid-cols-8';

interface ShortsShelfProps {
  shorts: Video[];
  /** Number of full rows to render — YouTube always fills the row edge to edge. */
  rows?: number;
}

export function ShortsShelf({ shorts, rows = 1 }: ShortsShelfProps) {
  const columns = useShortsColumns();
  // Only the hovered tile mounts a player; a whole row of them would be a
  // wall of simultaneous video streams.
  const [hovered, setHovered] = useState<string | null>(null);
  const visible = shorts.slice(0, columns * rows);

  if (visible.length < columns) return null;

  return (
    <section className="border-y border-yt-border py-6" aria-label="Shorts" style={{ borderTopWidth: "0px", borderRightWidth: "0px", borderBottomWidth: "0px", borderLeftWidth: "0px" }}>
      <header className="mb-4 flex items-center gap-2">
        <ShortsIcon className="h-6 w-6" filled />
        <h2 className="text-[20px] font-bold leading-7 text-yt-text">Shorts</h2>
      </header>

      <div className={SHORTS_GRID_CLASS}>
        {visible.map((short) => <article key={short.id} onMouseEnter={() => setHovered(short.id)} onMouseLeave={() => setHovered((current) => current === short.id ? null : current)} className="group relative isolate flex w-full flex-col">
            <HoverGlow src={short.thumbnail} />

            <Link to={`/shorts?v=${short.id}`} className="block">
              <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-yt-skeleton">
                {short.thumbnail && <img src={short.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]" />}
                {/* Shorts loop silently under the cursor, as on YouTube. */}
                <HoverPreview videoId={short.id} active={hovered === short.id} />
              </div>
            </Link>

            <div className="relative mt-2 pr-7">
              <h3>
                <Link to={`/shorts?v=${short.id}`} className="line-clamp-2 text-[14px] font-medium leading-5 text-yt-text">
                  {short.title}
                </Link>
              </h3>
              {short.views !== undefined && <p className="mt-1 text-[12px] leading-[18px] text-yt-sub">
                  {compact(short.views)} views
                </p>}
              <VideoMenuButton video={short} wrapperClassName="absolute right-0 top-0 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100" className="h-8 w-8" />
            </div>
          </article>)}
      </div>
    </section>);

}