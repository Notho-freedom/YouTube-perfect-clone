import React, { useEffect, useMemo, useState } from 'react';
import {
  AlignLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisVerticalIcon,
  FlagIcon } from
'lucide-react';
import type { CommentThread } from '../../types/youtube';
import { formatFull } from '../../utils/format';
import { fetchCommentReplies } from '../../utils/youtubeApi';
import { ChannelAvatar } from '../video/ChannelAvatar';
import { DropdownMenu } from '../ui/DropdownMenu';
import { useToast } from '../../contexts/ToastContext';
import { CommentRow } from './CommentRow';

interface CommentListProps {
  comments: CommentThread[];
  total?: number;
  disabled: boolean;
  loading: boolean;
  /** Compact chrome for the Music player's Comments tab. */
  dark?: boolean;
  /** Rendered above the comment controls, inside the same pinned block. */
  header?: React.ReactNode;
  /** Pin the header block; set once the player has docked. */
  sticky?: boolean;
}

type Sort = 'Top comments' | 'Newest first';

export function CommentList({
  comments,
  total,
  disabled,
  loading,
  dark = false,
  header,
  sticky = false
}: CommentListProps) {
  const [draft, setDraft] = useState('');
  const [sort, setSort] = useState<Sort>('Top comments');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [replies, setReplies] = useState<Record<string, CommentThread[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
  const { showToast } = useToast();

  // Sorting is applied to the threads already in hand. The API can re-sort
  // server-side, but that is another 1-unit call plus a full reload of the
  // list for a result the client can produce instantly.
  const ordered = useMemo(() => {
    if (sort === 'Newest first') {
      return [...comments].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    }
    return [...comments].sort((a, b) => b.likes - a.likes);
  }, [comments, sort]);

  // A new video means new threads; drop any expansion state from the old one.
  useEffect(() => {
    setExpanded({});
    setReplies({});
  }, [comments]);

  const toggleReplies = async (comment: CommentThread) => {
    const isOpen = expanded[comment.id];
    setExpanded((current) => ({ ...current, [comment.id]: !isOpen }));
    if (isOpen || replies[comment.id]) return;

    setLoadingReplies((current) => ({ ...current, [comment.id]: true }));
    try {
      const loaded = await fetchCommentReplies(comment.id);
      setReplies((current) => ({ ...current, [comment.id]: loaded }));
    } catch {
      showToast('Replies could not be loaded');
      setExpanded((current) => ({ ...current, [comment.id]: false }));
    } finally {
      setLoadingReplies((current) => ({ ...current, [comment.id]: false }));
    }
  };

  if (disabled) {
    return (
      <>
        {header}
        <section className="mt-6 rounded-xl bg-yt-chip p-4 text-[14px] leading-5 text-yt-sub">
          Comments are turned off for this video.
        </section>
      </>);

  }

  if (!loading && comments.length === 0) {
    return (
      <>
        {header}
        <section className="mt-6 rounded-xl bg-yt-chip p-4 text-[14px] leading-5 text-yt-sub">
          Comments could not be loaded right now.
        </section>
      </>);

  }

  if (loading) {
    return (
      <>
        {header}
        <section className="mt-6 space-y-6" aria-busy="true">
        {Array.from({ length: 4 }).map((_, index) =>
          <div key={index} className="flex animate-pulse gap-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-yt-skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-[12px] w-40 rounded bg-yt-skeleton" />
              <div className="h-[12px] w-full rounded bg-yt-skeleton" />
              <div className="h-[12px] w-2/3 rounded bg-yt-skeleton" />
            </div>
          </div>
          )}
        </section>
      </>);

  }

  return (
    <section className="pb-16">
      {/* The title block, the count, the sort control and the composer pin
           together once the player has docked; the threads slide underneath. */}
      <div
        className={`-mx-3 px-3 pb-4 ${
        sticky ? 'yt-header sticky top-14 z-20 pt-2' : ''}`
        }>
        
        {header}

        <div className="mt-6 flex items-center gap-8">
          <h2 className="text-[20px] font-bold leading-7 text-yt-text">
            {total !== undefined ? `${formatFull(total)} Comments` : 'Comments'}
          </h2>
          <DropdownMenu
            label="Sort comments"
            align="left"
            width={220}
            icon={
            <span className="flex items-center gap-2">
                <AlignLeftIcon className="h-5 w-5" strokeWidth={1.8} />
                {sort}
              </span>
            }
            triggerClassName="flex h-9 items-center rounded-lg px-3 text-[14px] font-medium leading-none text-yt-text transition-colors duration-150 hover:bg-yt-hover"
            items={(['Top comments', 'Newest first'] as Sort[]).map((option) => ({
              label: option,
              trailing:
              option === sort ? <span className="text-[13px] text-yt-sub">Selected</span> : undefined,
              onSelect: () => setSort(option)
            }))} />
          
        </div>

        <div className="mt-4 flex gap-4">
          <ChannelAvatar name="You" size={40} />
          <div className="flex-1">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              type="text"
              placeholder="Add a comment..."
              aria-label="Add a comment"
              className="h-8 w-full border-b border-yt-border bg-transparent text-[14px] text-yt-text outline-none placeholder:text-yt-sub focus:border-yt-text" />
            
            {draft.length > 0 &&
            <div className="mt-2 flex justify-end gap-2">
                <button
                type="button"
                onClick={() => setDraft('')}
                className="flex h-9 items-center rounded-full px-4 text-[14px] font-medium leading-none text-yt-text transition-colors duration-150 hover:bg-yt-hover">
                
                  Cancel
                </button>
                <button
                type="button"
                onClick={() => {
                  setDraft('');
                  showToast('Posting comments needs the YouTube write scope');
                }}
                className="flex h-9 items-center rounded-full bg-yt-blue px-4 text-[14px] font-medium leading-none text-white transition-opacity duration-150 hover:opacity-90">
                
                  Comment
                </button>
              </div>
            }
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-6">
        {ordered.map((comment) =>
        <li key={comment.id} className="relative">
            <CommentRow comment={comment} />

            {/* YouTube's thread connector: a hairline dropping out of the
               author's avatar and elbowing into the replies toggle. */}
            {comment.replyCount > 0 &&
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute left-[19px] top-[52px] border-l border-yt-border ${
            expanded[comment.id] ?
            'bottom-3 w-0' :
            'bottom-[30px] w-6 rounded-bl-[14px] border-b'}`
            } />

          }

            {comment.replyCount > 0 &&
          <div className="ml-14">
                <button
              type="button"
              onClick={() => void toggleReplies(comment)}
              aria-expanded={Boolean(expanded[comment.id])}
              className="mt-2 flex h-9 items-center gap-2 rounded-full px-3 text-[14px] font-medium leading-none text-yt-blue transition-colors duration-150 hover:bg-[rgba(6,95,212,0.1)] dark:hover:bg-[rgba(62,166,255,0.2)]">
              
                  {expanded[comment.id] ?
              <ChevronUpIcon className="h-5 w-5" strokeWidth={2} /> :

              <ChevronDownIcon className="h-5 w-5" strokeWidth={2} />
              }
                  {formatFull(comment.replyCount)}{' '}
                  {comment.replyCount === 1 ? 'reply' : 'replies'}
                </button>

                {expanded[comment.id] &&
            <div className="mt-3 space-y-4">
                    {loadingReplies[comment.id] ?
              <div className="flex animate-pulse gap-3" aria-busy="true">
                        <div className="h-6 w-6 shrink-0 rounded-full bg-yt-skeleton" />
                        <div className="flex-1 space-y-2">
                          <div className="h-[12px] w-32 rounded bg-yt-skeleton" />
                          <div className="h-[12px] w-2/3 rounded bg-yt-skeleton" />
                        </div>
                      </div> :

              (replies[comment.id] ?? []).map((reply) =>
              <CommentRow key={reply.id} comment={reply} compact />
              )
              }
                  </div>
            }
              </div>
          }
          </li>
        )}
      </ul>

      {!dark &&
      <p className="mt-10 flex items-center gap-2 text-[12px] leading-4 text-yt-sub">
          <FlagIcon className="h-4 w-4" strokeWidth={1.8} />
          Comments are read-only in this clone.
        </p>
      }
    </section>);

}