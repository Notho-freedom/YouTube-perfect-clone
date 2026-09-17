import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BellIcon,
  BookmarkCheckIcon,
  BookmarkIcon,
  EllipsisIcon,
  FlagIcon,
  ListVideoIcon,
  MonitorIcon,
  PictureInPicture2Icon,
  RectangleHorizontalIcon,
  ScissorsIcon,
  ShareIcon,
  ThumbsDownIcon,
  ThumbsUpIcon } from
'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext';
import { useToast } from '../../contexts/ToastContext';
import type { ChannelDetails, Video } from '../../types/youtube';
import { compact, compactPrecise, formatFull, timeAgo } from '../../utils/format';
import { DropdownMenu } from '../ui/DropdownMenu';
import { LikeBurst } from '../ui/LikeBurst';
import { ChannelAvatar } from '../video/ChannelAvatar';

interface WatchInfoProps {
  video: Video;
  channel?: ChannelDetails;
  theater?: boolean;
  onToggleTheater?: () => void;
  onMiniplayer?: () => void;
}

const pillClass =
'flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-yt-chip px-4 text-[14px] font-medium leading-none text-yt-text transition-colors duration-150 hover:bg-yt-chipHover';

export function WatchInfo({
  video,
  channel,
  theater = false,
  onToggleTheater,
  onMiniplayer
}: WatchInfoProps) {
  const {
    addToQueue,
    toggleWatchLater,
    isInWatchLater,
    toggleLike,
    toggleDislike,
    isLiked,
    isDisliked,
    toggleSubscription,
    isSubscribed
  } = useLibrary();
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);

  // Likes and subscriptions are native: the YouTube scope is read-only.
  const liked = isLiked(video.id);
  const disliked = isDisliked(video.id);
  const subscribed = isSubscribed(video.channelId);

  const likeCount = (video.likes ?? 0) + (liked ? 1 : 0);
  const hashtags = video.description.match(/#[\p{L}\p{N}_]+/gu)?.slice(0, 3) ?? [];
  const saved = isInWatchLater(video.id);

  return (
    <section className="mt-3">
      <h1 className="text-[20px] font-bold leading-7 text-yt-text">{video.title}</h1>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to={`/channel/${video.channelId}`} aria-label={video.channelTitle}>
            <ChannelAvatar
              name={video.channelTitle}
              src={channel?.avatar ?? video.channelAvatar}
              size={40} />
            
          </Link>
          <div className="min-w-0">
            <Link
              to={`/channel/${video.channelId}`}
              className="block truncate text-[16px] font-medium leading-[22px] text-yt-text">
              
              {video.channelTitle}
            </Link>
            {channel?.subscribers !== undefined &&
            <p className="text-[12px] leading-[18px] text-yt-sub">
                {compactPrecise(channel.subscribers)} subscribers
              </p>
            }
          </div>
          <button
            type="button"
            onClick={() => {
              toggleSubscription({
                channelId: video.channelId,
                title: video.channelTitle,
                avatar: channel?.avatar ?? video.channelAvatar
              });
              showToast(
                subscribed ?
                `Unsubscribed from ${video.channelTitle}` :
                `Subscribed to ${video.channelTitle}`
              );
            }}
            className={
            subscribed ?
            'ml-6 flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-yt-chip px-4 text-[14px] font-medium leading-none text-yt-text transition-colors duration-150 hover:bg-yt-chipHover' :
            'ml-6 flex h-9 shrink-0 items-center rounded-full bg-yt-inverse px-4 text-[14px] font-medium leading-none text-yt-inverseText transition-opacity duration-150 hover:opacity-90'
            }>
            
            {subscribed &&
            <BellIcon className="h-[18px] w-[18px] yt-thumb-pop" strokeWidth={1.8} />
            }
            {subscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-9 shrink-0 items-center rounded-full bg-yt-chip">
            <LikeBurst active={liked}>
              <button
                type="button"
                onClick={() => toggleLike(video)}
                aria-pressed={liked}
                className="flex h-9 items-center gap-1.5 rounded-l-full px-4 text-[14px] font-medium leading-none text-yt-text transition-colors duration-150 hover:bg-yt-chipHover">
                
                <ThumbsUpIcon
                  className={`h-[22px] w-[22px] ${liked ? 'yt-thumb-pop' : ''}`}
                  strokeWidth={1.8}
                  fill={liked ? 'currentColor' : 'none'} />
                
                {likeCount > 0 ? compact(likeCount) : 'Like'}
              </button>
            </LikeBurst>
            <span className="h-6 w-px bg-yt-border" aria-hidden="true" />
            <button
              type="button"
              onClick={() => toggleDislike(video)}
              aria-pressed={disliked}
              aria-label="Dislike this video"
              className="flex h-9 items-center rounded-r-full px-4 text-yt-text transition-colors duration-150 hover:bg-yt-chipHover">
              
              <ThumbsDownIcon
                className="h-[22px] w-[22px]"
                strokeWidth={1.8}
                fill={disliked ? 'currentColor' : 'none'} />
              
            </button>
          </div>

          <button
            type="button"
            onClick={async () => {
              const url = `${window.location.origin}/watch?v=${video.id}`;
              try {
                await navigator.clipboard.writeText(url);
                showToast('Link copied to clipboard');
              } catch {
                showToast(url);
              }
            }}
            className={pillClass}>
            
            <ShareIcon className="h-[22px] w-[22px]" strokeWidth={1.8} />
            Share
          </button>
          <button
            type="button"
            onClick={async () => {
              // A clip is a timestamped link; that much we can genuinely do.
              const url = `${window.location.origin}/watch?v=${video.id}&t=0`;
              try {
                await navigator.clipboard.writeText(url);
                showToast('Clip link copied — trimming needs the YouTube app');
              } catch {
                showToast('Could not copy the clip link');
              }
            }}
            className={`${pillClass} hidden md:flex`}>
            
            <ScissorsIcon className="h-[22px] w-[22px]" strokeWidth={1.8} />
            Clip
          </button>
          <button
            type="button"
            onClick={() => toggleWatchLater(video)}
            aria-pressed={saved}
            className={pillClass}>
            
            {saved ?
            <BookmarkCheckIcon className="h-[22px] w-[22px]" strokeWidth={1.8} /> :

            <BookmarkIcon className="h-[22px] w-[22px]" strokeWidth={1.8} />
            }
            {saved ? 'Saved' : 'Save'}
          </button>
          <DropdownMenu
            label="More actions"
            align="right"
            width={280}
            icon={<EllipsisIcon className="h-5 w-5" strokeWidth={2} />}
            triggerClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yt-chip text-yt-text transition-colors duration-150 hover:bg-yt-chipHover"
            items={[
            {
              icon: theater ?
              <MonitorIcon className="h-6 w-6" strokeWidth={1.8} /> :

              <RectangleHorizontalIcon className="h-6 w-6" strokeWidth={1.8} />,

              label: theater ? 'Default view (t)' : 'Theater mode (t)',
              onSelect: onToggleTheater
            },
            {
              icon: <PictureInPicture2Icon className="h-6 w-6" strokeWidth={1.8} />,
              label: 'Miniplayer',
              onSelect: onMiniplayer
            },
            {
              icon: <ListVideoIcon className="h-6 w-6" strokeWidth={1.8} />,
              label: 'Add to queue',
              separated: true,
              onSelect: () => {
                addToQueue(video);
                showToast('Added to queue');
              }
            },
            {
              icon: <FlagIcon className="h-6 w-6" strokeWidth={1.8} />,
              label: 'Report',
              onSelect: () => showToast('Report sent')
            }]
            } />
          
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-yt-chip p-3 text-[14px] leading-5 text-yt-text">
        <p className="font-medium">
          {video.views !== undefined && `${formatFull(video.views)} views`}
          {video.publishedAt && ` ${timeAgo(video.publishedAt)}`}
          {hashtags.length > 0 && <span className="text-yt-blue">{` ${hashtags.join(' ')}`}</span>}
        </p>
        <p className={`mt-1 whitespace-pre-line ${expanded ? '' : 'line-clamp-2'}`}>
          {video.description || 'No description.'}
        </p>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 text-[14px] font-medium leading-5 text-yt-text">
          
          {expanded ? 'Show less' : '...more'}
        </button>
      </div>
    </section>);

}