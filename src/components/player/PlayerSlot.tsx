import React, { useEffect, useRef } from 'react';
import { usePlayer } from '../../contexts/PlayerContext';

interface PlayerSlotProps {
  className?: string;
}

/**
 * Reserves the space the persistent player docks into on the watch page and
 * keeps reporting its position, so the player tracks scrolling and layout
 * changes instead of being re-mounted (which would restart playback).
 *
 * Leaving the watch page hands playback to the floating miniplayer rather than
 * stopping it, so navigating away never interrupts what you are watching.
 */
export function PlayerSlot({ className = '' }: PlayerSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { setRect, mode, setMode, audioOnly } = usePlayer();
  const modeRef = useRef(mode);
  modeRef.current = mode;
  // In Music, leaving the player page hands playback to the bottom bar, not
  // to a floating video frame — that affordance belongs to YouTube only.
  const audioRef = useRef(audioOnly);
  audioRef.current = audioOnly;

  useEffect(() => {
    if (modeRef.current === 'mini') setMode('inline');
  }, [setMode]);

  useEffect(() => {
    const update = () => {
      const element = ref.current;
      if (!element) return;
      const bounds = element.getBoundingClientRect();
      setRect({
        top: Math.round(bounds.top),
        left: Math.round(bounds.left),
        width: Math.round(bounds.width),
        height: Math.round(bounds.height)
      });
    };

    update();
    const observer = new ResizeObserver(update);
    if (ref.current) observer.observe(ref.current);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    const interval = window.setInterval(update, 400);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      window.clearInterval(interval);
      setRect(null);
      if (modeRef.current === 'inline' && !audioRef.current) setMode('mini');
    };
  }, [setRect, setMode]);

  return <div ref={ref} className={`aspect-video w-full bg-black ${className}`} />;
}