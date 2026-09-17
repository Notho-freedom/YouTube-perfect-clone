import React from 'react';
import { Link } from 'react-router-dom';
import type { Video } from '../../types/youtube';
import { compact, timeAgo, viewsLabel } from '../../utils/format';
import { HoverGlow } from './HoverGlow';
import { VideoMenuButton } from './VideoMenuButton';
import { VideoThumbnail } from './VideoThumbnail';

interface CompactVideoCardProps {
  video: Video;
}

/**
 * The row used by the watch page rail.
 *
 * The thumbnail takes 60% of the row's width and the metadata the remaining
 * 40%, which is the proportion YouTube uses. Because the row scales with the
 * rail instead of being pinned to a fixed 168px, the thumbnails are large
 * enough that roughly five rows fill the column — the same density as YouTube,
 * where a fixed small thumbnail let seven or eight pile up.
 */
export function CompactVideoCard({ video }: CompactVideoCardProps) {
  const meta = video.isLive ?
  `${compact(video.views)} watching` :
  [viewsLabel(video.views), timeAgo(video.publishedAt)].filter(Boolean).join(' • ');

  return (
    // `focus-within:z-30` is what keeps an open options menu above the cards
    // below it: each card is its own stacking context, so without it a later
    // sibling's title paints straight over the open menu.
    <article className="group relative isolate z-0 flex gap-2 focus-within:z-30">
      <HoverGlow src={video.thumbnail} variant="row" rounded="rounded-xl" />

      <Link to={`/watch?v=${video.id}`} className="w-[55%] shrink-0">
        <VideoThumbnail video={video} rounded="rounded-lg" />
      </Link>

      <div className="min-w-0 flex-1">
        {/* The kebab sits at the bottom of the row, so only the last line of
             metadata needs to keep clear of it. */}
        <h3>
          <Link
            to={`/watch?v=${video.id}`}
            className="line-clamp-2 text-[14px] font-medium leading-5 text-yt-text">
            
            {video.title}
          </Link>
        </h3>
        <Link
          to={`/channel/${video.channelId}`}
          className="mt-1 block truncate text-[12px] leading-[18px] text-yt-sub transition-colors duration-150 hover:text-yt-text">
          
          {video.channelTitle}
        </Link>
        {meta && <p className="truncate pr-8 text-[12px] leading-[18px] text-yt-sub">{meta}</p>}
      </div>

      <VideoMenuButton
        video={video}
        // Bottom-aligned, as on YouTube, not pinned to the top of the row.
        wrapperClassName="absolute bottom-0 right-0 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100"
        className="h-8 w-8" />
      
    </article>);

}