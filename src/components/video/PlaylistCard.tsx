import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListVideoIcon, PlayIcon } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import { usePlaylistPreview } from '../../hooks/usePlaylistPreview';
import type { PlaylistSummary } from '../../types/youtube';
import { formatFull } from '../../utils/format';
import { HoverGlow } from './HoverGlow';

interface PlaylistCardProps {
  playlist: PlaylistSummary;
  /** Where the card navigates — defaults to the playlist page. */
  to?: string;
}

export function PlaylistCard({ playlist, to }: PlaylistCardProps) {
  const navigate = useNavigate();
  const { playList } = usePlayer();
  const { load } = usePlaylistPreview();
  const target = to ?? `/playlist?list=${encodeURIComponent(playlist.id)}`;

  const playAll = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const videos = await load(playlist.id);
    if (videos.length === 0) {
      navigate(target);
      return;
    }
    playList(videos, 0, playlist.id);
    // A card rendered inside Music must never hand off to YouTube's watch
    // page: playback stays in Music's own player.
    navigate(
      target.startsWith('/music') ?
      '/music/player' :
      `/watch?v=${videos[0].id}&list=${encodeURIComponent(playlist.id)}`
    );
  };

  return (
    <article className="group relative isolate flex w-full flex-col">
      <HoverGlow src={playlist.thumbnail} />

      <Link to={target} className="block">
        <div className="relative">
          {/* stacked sheets behind the cover, like YouTube's playlist thumbnail */}
          <div className="mx-2 h-1.5 rounded-t-lg bg-yt-chip" aria-hidden="true" />
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-yt-skeleton">
            {playlist.thumbnail &&
            <img
              src={playlist.thumbnail}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover" />

            }
            <div className="absolute inset-y-0 right-0 flex w-[46%] flex-col items-center justify-center gap-1 bg-black/60 text-white">
              <ListVideoIcon className="h-5 w-5" strokeWidth={1.8} />
              <span className="text-[13px] font-medium leading-none">
                {formatFull(playlist.itemCount)}
              </span>
              <span className="text-[11px] leading-none opacity-80">
                {playlist.itemCount === 1 ? 'video' : 'videos'}
              </span>
            </div>

            <button
              type="button"
              onClick={playAll}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100">
              
              <span className="flex items-center gap-2 text-[14px] font-medium text-white">
                <PlayIcon className="h-5 w-5 fill-current" strokeWidth={0} />
                Play all
              </span>
            </button>
          </div>
        </div>
      </Link>

      <div className="mt-3">
        <h3 className="line-clamp-2 text-[16px] font-medium leading-[22px] text-yt-text">
          <Link to={target}>{playlist.title}</Link>
        </h3>
        <p className="mt-1 text-[12px] leading-[18px] text-yt-sub">{playlist.channelTitle}</p>
        <Link
          to={target}
          className="text-[12px] leading-[18px] text-yt-sub transition-colors duration-150 hover:text-yt-text">
          
          View full playlist
        </Link>
      </div>
    </article>);

}