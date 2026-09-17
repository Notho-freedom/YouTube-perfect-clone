import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkIcon, PlayIcon } from 'lucide-react';
import { PlayerSlot } from '../../components/player/PlayerSlot';
import { ChannelAvatar } from '../../components/video/ChannelAvatar';
import { CommentList } from '../../components/watch/CommentList';
import { useLibrary } from '../../contexts/LibraryContext';
import { usePlayer } from '../../contexts/PlayerContext';
import { useToast } from '../../contexts/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { useChannelProfile } from '../../hooks/useChannel';
import { useDominantColor } from '../../hooks/useDominantColor';
import { useMusicPlayback } from '../../hooks/useMusicPlayback';
import type { Video } from '../../types/youtube';
import { compact, compactPrecise, formatDuration } from '../../utils/format';
import { fetchComments, fetchRelated, type CommentsResult } from '../../utils/youtubeApi';
import { FeedPlaceholder } from '../FeedPlaceholder';

const TABS = ['Up next', 'Lyrics', 'Comments', 'Related'] as const;
type Tab = (typeof TABS)[number];

export function MusicPlayer() {
  const { video, queue, queueIndex, audioOnly, setAudioOnly } = usePlayer();
  const { toggleWatchLater, isInWatchLater } = useLibrary();
  const { showToast } = useToast();
  const start = useMusicPlayback();
  const [tab, setTab] = useState<Tab>('Up next');
  // YouTube Music plays audio: the artwork is the default surface and the
  // video track only appears if the listener explicitly asks for it.
  const [surface, setSurface] = useState<'song' | 'video'>('song');
  const [autoplay, setAutoplay] = useState(true);

  const rgb = useDominantColor(video?.thumbnail);
  const { channel } = useChannelProfile(video?.channelId ?? '');

  // Arriving here from YouTube hands the current video over to Music.
  useEffect(() => {
    if (video && !audioOnly) setAudioOnly(true);
  }, [video, audioOnly, setAudioOnly]);

  // Comments and related songs are only fetched when their tab is opened —
  // both cost quota and most sessions never leave "Up next".
  const extras = useAsync(async (): Promise<{
    comments?: CommentsResult;
    related?: Video[];
  }> => {
    if (!video) return {};
    if (tab === 'Comments') {
      const comments = await fetchComments(video.id, 20).catch(
        (): CommentsResult => ({ threads: [], disabled: false })
      );
      return { comments };
    }
    if (tab === 'Related') {
      return { related: await fetchRelated(video, 16).catch(() => [] as Video[]) };
    }
    return {};
  }, [tab, video?.id]);

  if (!video) {
    return (
      <FeedPlaceholder
        title="Nothing is playing"
        description="Pick a song from YouTube Music and the player will open here." />);


  }

  const saved = isInWatchLater(video.id);

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      {/* YouTube Music's ambient wash, taken from the artwork. */}
      {rgb &&
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[85vh]"
        style={{
          background: `radial-gradient(70% 55% at 32% 0%, rgba(${rgb}, 0.42) 0%, rgba(3, 3, 3, 0) 76%)`
        }} />

      }

      <div className="relative mx-auto flex max-w-[1800px] flex-col gap-12 px-4 py-8 sm:px-8 lg:flex-row lg:items-start">
        {/* Left column is pinned: only the queue on the right scrolls. */}
        <div className="min-w-0 flex-1 lg:sticky lg:top-[88px]">
          <div
            className={`mx-auto w-full ${
            surface === 'video' ? 'max-w-[980px]' : 'max-w-[760px]'}`
            }>
            
            {/* The SONG | VIDEO switch sits above the surface as a pill pair,
                 so the video itself keeps the full width below it. */}
            <div className="mb-4 flex justify-center">
              <div
                role="tablist"
                aria-label="Playback surface"
                className="flex items-center gap-1 rounded-full bg-white/[0.08] p-1">
                
                {(['song', 'video'] as const).map((item) =>
                <button
                  key={item}
                  type="button"
                  role="tab"
                  onClick={() => setSurface(item)}
                  aria-selected={item === surface}
                  className={`h-8 rounded-full px-5 text-[12px] font-medium uppercase tracking-[0.08em] transition-colors duration-150 ${
                  item === surface ?
                  'bg-white text-black' :
                  'text-white/60 hover:text-white'}`
                  }>
                  
                    {item}
                  </button>
                )}
              </div>
            </div>

            {surface === 'song' ?
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
                {video.thumbnail &&
              <img
                src={video.thumbnail}
                alt=""
                className="h-full w-full scale-[1.35] object-cover" />

              }
              </div> :

            <PlayerSlot className="rounded-lg" />
            }

            {/* In video mode the clip is the subject: the artist block would
                 only push it smaller, so it is dropped, as on YouTube Music. */}
            <div className={`mt-6 items-start gap-4 ${surface === 'video' ? 'hidden' : 'flex'}`}>
              <Link to={`/music/artist/${video.channelId}`} aria-label={video.channelTitle}>
                <ChannelAvatar name={video.channelTitle} src={channel?.avatar} size={48} />
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="line-clamp-2 text-[22px] font-bold leading-7 text-white">
                  {video.title}
                </h1>
                <Link
                  to={`/music/artist/${video.channelId}`}
                  className="mt-1 block truncate text-[14px] leading-5 text-white/70 transition-colors duration-150 hover:text-white">
                  
                  {video.channelTitle}
                </Link>
                <p className="mt-0.5 truncate text-[12px] leading-4 text-white/50">
                  {[
                  channel?.subscribers !== undefined &&
                  `${compactPrecise(channel.subscribers)} subscribers`,
                  video.views !== undefined && `${compact(video.views)} plays`,
                  formatDuration(video.duration)].

                  filter(Boolean).
                  join(' • ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  toggleWatchLater(video);
                  showToast(saved ? 'Removed from Saved' : 'Saved to library');
                }}
                className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-white/10 px-4 text-[14px] font-medium leading-none text-white transition-colors duration-150 hover:bg-white/20">
                
                <BookmarkIcon
                  className="h-[18px] w-[18px]"
                  strokeWidth={1.8}
                  fill={saved ? 'currentColor' : 'none'} />
                
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Right column: the tab strip, "Playing from" and the Autoplay row
             stay put while the queue scrolls beneath them. */}
        <div className="flex w-full shrink-0 flex-col lg:sticky lg:top-[88px] lg:h-[calc(100vh-176px)] lg:w-[460px]">
          <div className="no-scrollbar mb-4 flex shrink-0 gap-6 overflow-x-auto border-b border-white/10">
            {TABS.map((item) =>
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              aria-pressed={item === tab}
              className={`-mb-px shrink-0 border-b-2 pb-3 text-[13px] font-medium uppercase tracking-wide transition-colors duration-150 ${
              item === tab ?
              'border-white text-white' :
              'border-transparent text-white/50 hover:text-white'}`
              }>
              
                {item}
              </button>
            )}
          </div>

          {tab === 'Up next' &&
          <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-3 shrink-0">
                <p className="text-[12px] leading-4 text-white/60">Playing from</p>
                <p className="text-[16px] font-bold leading-6 text-white">
                  {queue.length > 1 ? `Mix — ${video.channelTitle}` : video.title}
                </p>
              </div>

              <div className="mb-3 flex shrink-0 items-center justify-between gap-4 border-b border-white/10 pb-3">
                <div>
                  <p className="text-[14px] font-medium leading-5 text-white">Autoplay</p>
                  <p className="text-[12px] leading-4 text-white/60">
                    Keep adding similar songs to the queue
                  </p>
                </div>
                <button
                type="button"
                onClick={() => setAutoplay((value) => !value)}
                role="switch"
                aria-checked={autoplay}
                aria-label="Autoplay"
                className={`relative h-4 w-10 shrink-0 rounded-full transition-colors duration-150 ${
                autoplay ? 'bg-yt-blue' : 'bg-white/30'}`
                }>
                
                  <span
                  className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white transition-[left] duration-150 ease-out ${
                  autoplay ? 'left-6' : 'left-0'}`
                  } />
                
                </button>
              </div>

              <ol className="yt-scroll min-h-0 flex-1 overflow-y-auto pr-1">
                {queue.map((track, index) => {
                const active = index === queueIndex;
                return (
                  <li key={`${track.id}-${index}`}>
                      <button
                      type="button"
                      onClick={() => start(queue, index)}
                      className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors duration-150 ${
                      active ? 'bg-white/10' : 'hover:bg-white/5'}`
                      }>
                      
                        <span className="flex w-5 shrink-0 justify-center text-[12px] text-white/50">
                          {active ?
                        <PlayIcon className="h-3 w-3 fill-white text-white" strokeWidth={0} /> :

                        index + 1
                        }
                        </span>
                        <span className="h-10 w-10 shrink-0 overflow-hidden rounded bg-white/10">
                          {track.thumbnail &&
                        <img
                          src={track.thumbnail}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover" />

                        }
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium leading-5 text-white">
                            {track.title}
                          </span>
                          <span className="block truncate text-[12px] leading-4 text-white/60">
                            {track.channelTitle}
                          </span>
                        </span>
                        <span className="shrink-0 text-[12px] tabular-nums text-white/50">
                          {formatDuration(track.duration)}
                        </span>
                      </button>
                    </li>);

              })}
              </ol>
            </div>
          }

          {tab === 'Lyrics' &&
          <p className="max-w-[420px] text-[14px] leading-6 text-white/60">
              Lyrics are not exposed by the YouTube Data API, so they cannot be shown here.
              Everything else on this page — the queue, comments, related songs and playback — is
              live.
            </p>
          }

          {tab === 'Comments' &&
          <div className="yt-scroll -mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
              <CommentList
              comments={extras.data?.comments?.threads ?? []}
              total={extras.data?.comments?.total}
              disabled={extras.data?.comments?.disabled ?? false}
              loading={extras.loading} />
            
            </div>
          }

          {tab === 'Related' &&
          <div className="yt-scroll min-h-0 flex-1 overflow-y-auto pr-1">
              {extras.loading ?
            <div className="space-y-3" aria-busy="true">
                  {Array.from({ length: 6 }).map((_, index) =>
              <div key={index} className="flex animate-pulse items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded bg-white/10" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 rounded bg-white/10" />
                        <div className="h-3 w-1/3 rounded bg-white/10" />
                      </div>
                    </div>
              )}
                </div> :

            (extras.data?.related ?? []).map((track, index) =>
            <button
              key={track.id}
              type="button"
              onClick={() => start(extras.data?.related ?? [], index)}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors duration-150 hover:bg-white/5">
              
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded bg-white/10">
                      {track.thumbnail &&
                <img
                  src={track.thumbnail}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover" />

                }
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium leading-5 text-white">
                        {track.title}
                      </span>
                      <span className="block truncate text-[12px] leading-4 text-white/60">
                        {track.channelTitle}
                      </span>
                    </span>
                  </button>
            )
            }
            </div>
          }
        </div>
      </div>
    </div>);

}