import React from 'react';
import {
  BanIcon,
  ClockIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  FlagIcon,
  ListPlusIcon,
  ListVideoIcon,
  ShareIcon,
  Trash2Icon,
  XCircleIcon } from
'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext';
import { useToast } from '../../contexts/ToastContext';
import type { Video } from '../../types/youtube';
import { DropdownMenu, type MenuItem } from '../ui/DropdownMenu';

interface VideoMenuButtonProps {
  video: Video;
  /** History rows add a "Remove from watch history" entry. */
  onRemoveFromHistory?: () => void;
  className?: string;
  wrapperClassName?: string;
  align?: 'left' | 'right';
}

const ICON = 'h-6 w-6';

export function VideoMenuButton({
  video,
  onRemoveFromHistory,
  className = '',
  wrapperClassName = '',
  align = 'right'
}: VideoMenuButtonProps) {
  const {
    addToQueue,
    toggleWatchLater,
    isInWatchLater,
    playlists,
    createPlaylist,
    togglePlaylistVideo,
    isInPlaylist,
    muteChannel,
    toggleDislike
  } = useLibrary();
  const { showToast } = useToast();
  const saved = isInWatchLater(video.id);

  const share = async () => {
    const url = `${window.location.origin}/watch?v=${video.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard');
    } catch {
      showToast(url);
    }
  };

  const items: MenuItem[] = [
  {
    icon: <ListVideoIcon className={ICON} strokeWidth={1.8} />,
    label: 'Add to queue',
    onSelect: () => {
      addToQueue(video);
      showToast('Added to queue');
    }
  },
  {
    icon: <ClockIcon className={ICON} strokeWidth={1.8} />,
    label: saved ? 'Remove from Watch later' : 'Save to Watch later',
    onSelect: () => {
      toggleWatchLater(video);
      showToast(saved ? 'Removed from Watch later' : 'Saved to Watch later');
    }
  },
  ...playlists.slice(0, 4).map((playlist) => ({
    icon: <ListPlusIcon className={ICON} strokeWidth={1.8} />,
    label: `${isInPlaylist(playlist.id, video.id) ? 'Remove from' : 'Save to'} ${playlist.title}`,
    onSelect: () => {
      const had = isInPlaylist(playlist.id, video.id);
      togglePlaylistVideo(playlist.id, video);
      showToast(had ? `Removed from ${playlist.title}` : `Saved to ${playlist.title}`);
    }
  })),
  {
    icon: <ListPlusIcon className={ICON} strokeWidth={1.8} />,
    label: 'Save to new playlist',
    onSelect: () => {
      const playlist = createPlaylist(`${video.channelTitle} picks`, video);
      showToast(`Created "${playlist.title}"`);
    }
  },
  {
    icon: <DownloadIcon className={ICON} strokeWidth={1.8} />,
    label: 'Download',
    onSelect: () => showToast('Downloads need YouTube Premium')
  },
  {
    icon: <ShareIcon className={ICON} strokeWidth={1.8} />,
    label: 'Share',
    onSelect: share
  }];


  if (onRemoveFromHistory) {
    items.push({
      icon: <Trash2Icon className={ICON} strokeWidth={1.8} />,
      label: 'Remove from watch history',
      separated: true,
      onSelect: () => {
        onRemoveFromHistory();
        showToast('Removed from watch history');
      }
    });
  }

  items.push(
    {
      icon: <XCircleIcon className={ICON} strokeWidth={1.8} />,
      label: 'Not interested',
      separated: !onRemoveFromHistory,
      onSelect: () => {
        toggleDislike(video);
        showToast('Thanks — this feeds your recommendations');
      }
    },
    {
      icon: <BanIcon className={ICON} strokeWidth={1.8} />,
      label: "Don't recommend channel",
      onSelect: () => {
        muteChannel(video.channelId);
        showToast(`${video.channelTitle} won't be recommended`);
      }
    },
    {
      icon: <FlagIcon className={ICON} strokeWidth={1.8} />,
      label: 'Report',
      onSelect: () => showToast('Report sent')
    }
  );

  return (
    <DropdownMenu
      items={items}
      label="More actions"
      align={align}
      width={280}
      icon={<EllipsisVerticalIcon className="h-5 w-5" strokeWidth={2} />}
      wrapperClassName={wrapperClassName}
      triggerClassName={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-yt-text transition-colors duration-150 hover:bg-yt-hover ${className}`} />);


}