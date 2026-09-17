import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SkipBackIcon, SkipForwardIcon } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { PlayerSlot } from '../components/player/PlayerSlot';
import { CommentList } from '../components/watch/CommentList';
import { LiveChat } from '../components/watch/LiveChat';
import { PlaylistPanel } from '../components/watch/PlaylistPanel';
import { RelatedPanel } from '../components/watch/RelatedPanel';
import { VideoPlayer } from '../components/watch/VideoPlayer';
import { WatchInfo } from '../components/watch/WatchInfo';
import { useApp } from '../contexts/AppContext';
import { useLibrary } from '../contexts/LibraryContext';
import { usePlayer } from '../contexts/PlayerContext';
import { usePlaylist } from '../hooks/usePlaylist';
import { useWatchData } from '../hooks/useYouTube';

export function Watch() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const videoId = params.get('v') ?? '';
  const listId = params.get('list');

  const { data, loading, failed } = useWatchData(videoId);
  const { playlist } = usePlaylist(listId);
  const { recordWatch } = useLibrary();
  const { theme } = useApp();
  const {
    play,
    playList,
    setMode,
    video: playingVideo,
    queue,
    next,
    previous
  } = usePlayer();

  const queueLength = queue.length;
  const listSuffix = listId ? `&list=${encodeURIComponent(listId)}` : '';

  const [theater, setTheater] = useState(false);
  // True once the inline player has scrolled out of view.
  const [docked, setDocked] = useState(false);
  const playerSentinel = useRef<HTMLDivElement>(null);

  const embeddable = Boolean(data && !data.video.id.startsWith('sample-'));
  const watchedId = data?.video.id;

  useEffect(() => {
    if (data?.video && watchedId) recordWatch(data.video);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedId]);

  // Hand the video to the persistent player, with its list when there is one.
  useEffect(() => {
    if (!data?.video || !embeddable) return;
    if (playingVideo?.id === data.video.id) return;

    const queue = playlist?.videos ?? [];
    const index = queue.findIndex((item) => item.id === data.video.id);
    if (listId && index >= 0) playList(queue, index, listId);else
    play(data.video);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedId, embeddable, listId, playlist?.id, playlist?.videos.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      if (event.key === 't') setTheater((value) => !value);
      if (event.key === 'i') openMiniplayer();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Auto-dock: the miniplayer takes over the moment the inline player is no
  // longer on screen, and hands back when it returns. Only while watching —
  // leaving the page entirely is handled by PlayerSlot's own teardown.
  useEffect(() => {
    const target = playerSentinel.current;
    if (!target || theater || !embeddable) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setMode(entry.isIntersecting ? 'inline' : 'mini');
        setDocked(!entry.isIntersecting);
      },
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [theater, embeddable, watchedId, setMode]);

  const openMiniplayer = () => {
    setMode('mini');
    if (window.history.length > 1) navigate(-1);else
    navigate('/');
  };

  const skeleton =
  <div className="animate-pulse">
      <div className="aspect-video w-full rounded-xl bg-yt-skeleton" />
      <div className="mt-4 h-5 w-3/4 rounded bg-yt-skeleton" />
      <div className="mt-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-yt-skeleton" />
        <div className="h-4 w-40 rounded bg-yt-skeleton" />
      </div>
      <div className="mt-4 h-24 w-full rounded-xl bg-yt-skeleton" />
    </div>;


  const secondary =
  <>
      {/* Live chat sits above everything else, as on YouTube. */}
      {data?.video.isLive && <LiveChat videoId={data.video.id} />}
      {listId && playlist &&
    <PlaylistPanel
      title={playlist.title}
      subtitle={playlist.subtitle}
      videos={playlist.videos}
      activeId={videoId}
      listId={listId}
      onClose={() => navigate(`/watch?v=${videoId}`)} />

    }
      <RelatedPanel
      videos={data?.related ?? []}
      loading={loading}
      current={data?.video}
      stacked={theater} />
    
    </>;


  return (
    <div className={`pb-10 ${theater ? 'pt-0' : 'pt-6'}`}>
      {theater &&
      <div className="w-full bg-black">
          <div className="w-full">
            {embeddable ?
          <PlayerSlot className="max-h-[86vh]" /> :

          data && <VideoPlayer video={data.video} embeddable={false} rounded={false} />
          }
          </div>
        </div>
      }

      {/* Gutters are measured against the masthead's own left inset (16px,
           24px from sm up): 90% of it on the left so the player is not welded
           to the edge, 10% of it on the right so the rail still reads as
           flush. */}
      <div
        className={`flex w-full gap-6 ${
        theater ? 'flex-col px-2 pt-4' : 'flex-col pl-[14px] pr-[2px] sm:pl-[22px] lg:flex-row'}`
        }>
        
        {/* No width cap on the left column: capping it at 1280px left the
             surplus of a wide viewport sitting to the RIGHT of the rail, which
             is what held the rows away from the edge. The left column now
             absorbs everything the rail does not take. */}
        <div className="relative min-w-0 flex-1">

          {/* Ambient lighting: a blurred copy of the cover bleeding around the player. */}
          {!theater && data?.video.thumbnail &&
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-10 -top-10 -z-10 h-[560px]">
            
              <img
              src={data.video.thumbnail}
              alt=""
              className={`h-full w-full scale-[1.15] object-cover blur-[80px] ${
              theme === 'dark' ? 'opacity-45' : 'opacity-25'}`
              } />
            
            </div>
          }

          {failed ?
          <EmptyState
            art="error"
            title="This video isn't available"
            description="It may have been removed or made private, or the daily API quota is used up. The quota resets at midnight Pacific Time." /> :

          !data ?
          skeleton :

          <>
              {!theater && (
            embeddable ?
            // YouTube's own controls live inside a cross-origin iframe,
            // so they cannot be re-laid-out. What IS missing is queue
            // navigation, so previous/next are overlaid on the player
            // edges — clear of the native control bar — and appear on
            // hover, exactly where YouTube puts its playlist chevrons.
            <div className="group/player relative">
                    <PlayerSlot className="rounded-xl" />
                    {queueLength > 1 &&
              <>
                        <button
                  type="button"
                  onClick={() => {
                    const target = previous();
                    if (target) navigate(`/watch?v=${target.id}${listSuffix}`);
                  }}
                  aria-label="Previous video"
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity duration-150 ease-out hover:bg-black/80 focus-visible:opacity-100 group-hover/player:opacity-100">
                  
                          <SkipBackIcon className="h-5 w-5 fill-current" strokeWidth={0} />
                        </button>
                        <button
                  type="button"
                  onClick={() => {
                    const target = next();
                    if (target) navigate(`/watch?v=${target.id}${listSuffix}`);
                  }}
                  aria-label="Next video"
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity duration-150 ease-out hover:bg-black/80 focus-visible:opacity-100 group-hover/player:opacity-100">
                  
                          <SkipForwardIcon className="h-5 w-5 fill-current" strokeWidth={0} />
                        </button>
                      </>
              }
                  </div> :

            <VideoPlayer video={data.video} embeddable={false} />)
            }

              {/* Watched by an observer: once the player has scrolled past,
                 the video docks itself into the floating miniplayer so the
                 comments can be read without losing playback. */}
              {!theater && <div ref={playerSentinel} aria-hidden="true" className="h-px w-full" />}

              {/* Everything from the title down to "Add a comment" pins itself
                 once the player has docked, so the video's identity and the
                 comment controls stay on screen while the threads scroll. */}
              <div className="px-3">
                <CommentList
                comments={data.comments}
                total={data.video.commentCount}
                disabled={data.commentsDisabled}
                loading={loading}
                sticky={docked && !theater}
                header={
                <WatchInfo
                  video={data.video}
                  channel={data.channel}
                  theater={theater}
                  onToggleTheater={() => setTheater((value) => !value)}
                  onMiniplayer={openMiniplayer} />

                } />
              
              </div>
            </>
          }
        </div>

        {/* The rail holds still while the left column scrolls. */}
        <div
          className={
          theater ?
          '' :
          // `no-scrollbar`, not `yt-scroll`: a visible scrollbar both
          // showed a track and reserved ~8px, which is what stopped the
          // rows from reaching the right edge.
          'no-scrollbar w-full shrink-0 lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-80px)] lg:w-[452px] lg:overflow-y-auto xl:w-[500px]'
          }>
          
          {secondary}
        </div>
      </div>
    </div>);

}