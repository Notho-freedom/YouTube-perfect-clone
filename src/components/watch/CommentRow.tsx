import React, { useState } from 'react';
import { EllipsisVerticalIcon, ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import type { CommentThread } from '../../types/youtube';
import { compact, timeAgo } from '../../utils/format';
import { useToast } from '../../contexts/ToastContext';
import { DropdownMenu } from '../ui/DropdownMenu';
import { ChannelAvatar } from '../video/ChannelAvatar';
import { LikeBurst } from '../ui/LikeBurst';

interface CommentRowProps {
  comment: CommentThread;
  /** Replies sit at a smaller scale under their parent. */
  compact?: boolean;
}

export function CommentRow({ comment, compact: isReply = false }: CommentRowProps) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const { showToast } = useToast();

  const avatarSize = isReply ? 24 : 40;

  return (
    <div className="group flex gap-4">
      <ChannelAvatar name={comment.author} src={comment.authorAvatar} size={avatarSize} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-medium leading-[18px] text-yt-text">
            {comment.author}
          </span>
          <span className="shrink-0 text-[12px] leading-[18px] text-yt-sub">
            {timeAgo(comment.publishedAt)}
          </span>
        </div>

        <p
          className={`mt-1 whitespace-pre-line text-yt-text ${
          isReply ? 'text-[13px] leading-[18px]' : 'text-[14px] leading-5'}`
          }>
          
          {comment.text}
        </p>

        <div className="mt-1 flex items-center gap-2">
          <LikeBurst active={liked}>
            <button
              type="button"
              onClick={() => {
                setLiked((value) => !value);
                if (disliked) setDisliked(false);
              }}
              aria-pressed={liked}
              aria-label="Like this comment"
              className="flex h-8 w-8 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
              
              <ThumbsUpIcon
                className={`h-4 w-4 ${liked ? 'yt-thumb-pop' : ''}`}
                strokeWidth={1.8}
                fill={liked ? 'currentColor' : 'none'} />
              
            </button>
          </LikeBurst>

          {comment.likes + (liked ? 1 : 0) > 0 &&
          <span className="text-[12px] leading-[18px] text-yt-sub">
              {compact(comment.likes + (liked ? 1 : 0))}
            </span>
          }

          <button
            type="button"
            onClick={() => {
              setDisliked((value) => !value);
              if (liked) setLiked(false);
            }}
            aria-pressed={disliked}
            aria-label="Dislike this comment"
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover">
            
            <ThumbsDownIcon
              className="h-4 w-4"
              strokeWidth={1.8}
              fill={disliked ? 'currentColor' : 'none'} />
            
          </button>

          <button
            type="button"
            onClick={() => showToast('Replying needs the YouTube write scope')}
            className="ml-2 flex h-8 items-center rounded-full px-3 text-[12px] font-medium leading-none text-yt-text transition-colors duration-150 hover:bg-yt-hover">
            
            Reply
          </button>
        </div>
      </div>

      <DropdownMenu
        label="More actions"
        align="right"
        width={180}
        icon={<EllipsisVerticalIcon className="h-5 w-5" strokeWidth={2} />}
        wrapperClassName="shrink-0 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100"
        triggerClassName="flex h-8 w-8 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover"
        items={[
        { label: 'Report', onSelect: () => showToast('Report sent') },
        {
          label: 'Copy text',
          onSelect: () => {
            void navigator.clipboard.
            writeText(comment.text).
            then(() => showToast('Comment copied')).
            catch(() => showToast('Could not copy the comment'));
          }
        }]
        } />
      
    </div>);

}