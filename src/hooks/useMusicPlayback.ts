import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../contexts/PlayerContext';
import { useLibrary } from '../contexts/LibraryContext';
import type { Video } from '../types/youtube';

/**
 * Starting a track inside YouTube Music behaves like the real app: it loads
 * the queue, switches the player into music mode and opens the full player.
 */
export function useMusicPlayback(): (videos: Video[], index: number) => void {
  const { playTrack } = usePlayer();
  const { recordWatch } = useLibrary();
  const navigate = useNavigate();

  return useCallback(
    (videos: Video[], index: number) => {
      if (videos.length === 0) return;
      playTrack(videos, index);
      const track = videos[Math.max(0, Math.min(videos.length - 1, index))];
      if (track) recordWatch(track);
      navigate('/music/player');
    },
    [playTrack, recordWatch, navigate]
  );
}