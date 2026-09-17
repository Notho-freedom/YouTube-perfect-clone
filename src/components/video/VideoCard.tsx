import React from 'react';
import { Link } from 'react-router-dom';
import type { Video } from '../../types/youtube';
import { compact, timeAgo, viewsLabel } from '../../utils/format';
import { ChannelAvatar } from './ChannelAvatar';
import { HoverGlow } from './HoverGlow';
import { VideoMenuButton } from './VideoMenuButton';
import { VideoThumbnail } from './VideoThumbnail';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const meta = video.isLive ?
  `${compact(video.views)} watching` :
  [viewsLabel(video.views), timeAgo(video.publishedAt)].filter(Boolean).join(' • ');

  return (
    <article className="group relative isolate flex w-full flex-col">
      <HoverGlow src={video.thumbnail} />

      {/* Slight lift under the cursor, with the transform named explicitly so
           the hover-preview iframe inside is not re-composited needlessly. */}
      <Link
        to={`/watch?v=${video.id}`}
        className="block origin-center transition-transform duration-200 ease-out group-hover:scale-[1.015]">
        
        <VideoThumbnail video={video} />
      </Link>

      <div className="mt-3 flex gap-3">
        <Link
          to={`/channel/${video.channelId}`}
          aria-label={video.channelTitle}
          className="shrink-0">
          
          <ChannelAvatar name={video.channelTitle} src={video.channelAvatar} size={36} />
        </Link>

        <div className="min-w-0 flex-1">
          <h3>
            <Link
              to={`/watch?v=${video.id}`}
              className="line-clamp-2 text-[16px] font-medium leading-[22px] text-yt-text transition-colors duration-150 group-hover:text-yt-text">
              
              {video.title}
            </Link>
          </h3>
          <Link
            to={`/channel/${video.channelId}`}
            className="mt-1 block truncate text-[12px] leading-[18px] text-yt-sub transition-colors duration-150 hover:text-yt-text">
            
            {video.channelTitle}
          </Link>
          {meta && <p className="truncate text-[12px] leading-[18px] text-yt-sub">{meta}</p>}
        </div>

        <VideoMenuButton video={video} className="-mr-2 -mt-1" />
      </div>
    </article>);

}