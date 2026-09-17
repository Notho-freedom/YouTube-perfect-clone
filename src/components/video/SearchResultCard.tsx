import React from 'react';
import { Link } from 'react-router-dom';
import type { Video } from '../../types/youtube';
import { compact, timeAgo, viewsLabel } from '../../utils/format';
import { ChannelAvatar } from './ChannelAvatar';
import { HoverGlow } from './HoverGlow';
import { VideoMenuButton } from './VideoMenuButton';
import { VideoThumbnail } from './VideoThumbnail';

interface SearchResultCardProps {
  video: Video;
  onRemoveFromHistory?: () => void;
}

export function SearchResultCard({ video, onRemoveFromHistory }: SearchResultCardProps) {
  const meta = video.isLive ?
  `${compact(video.views)} watching` :
  [viewsLabel(video.views), timeAgo(video.publishedAt)].filter(Boolean).join(' • ');

  return (
    <article className="group relative isolate flex flex-col gap-3 sm:flex-row sm:gap-4">
      <HoverGlow src={video.thumbnail} variant="row" />

      <Link to={`/watch?v=${video.id}`} className="w-full shrink-0 sm:w-[360px]">
        <VideoThumbnail video={video} />
      </Link>

      <div className="flex min-w-0 flex-1 gap-2">
        <div className="min-w-0 flex-1">
          <h3>
            <Link
              to={`/watch?v=${video.id}`}
              className="line-clamp-2 text-[18px] leading-[26px] text-yt-text">
              
              {video.title}
            </Link>
          </h3>
          {meta && <p className="mt-1 text-[12px] leading-[18px] text-yt-sub">{meta}</p>}

          <Link
            to={`/channel/${video.channelId}`}
            className="mt-3 flex w-fit items-center gap-1.5 text-yt-sub transition-colors duration-150 hover:text-yt-text">
            
            <ChannelAvatar name={video.channelTitle} src={video.channelAvatar} size={24} />
            <span className="truncate text-[12px] leading-[18px]">{video.channelTitle}</span>
          </Link>

          {video.description &&
          <p className="mt-2 line-clamp-2 text-[12px] leading-[18px] text-yt-sub">
              {video.description}
            </p>
          }
        </div>

        <VideoMenuButton video={video} onRemoveFromHistory={onRemoveFromHistory} />
      </div>
    </article>);

}