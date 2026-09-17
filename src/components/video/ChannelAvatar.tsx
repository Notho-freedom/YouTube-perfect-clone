import React from 'react';

const PALETTE = ['#8e2b2b', '#2f4858', '#3a5a40', '#5c4d7d', '#2b5f8e', '#8a5a2b', '#4a5a6a'];

function colorFor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 100_000;
  }
  return PALETTE[hash % PALETTE.length];
}

interface ChannelAvatarProps {
  name: string;
  src?: string;
  /** Rendered size in pixels. */
  size?: number;
  className?: string;
}

export function ChannelAvatar({ name, src, size = 36, className = '' }: ChannelAvatarProps) {
  const style = { width: size, height: size };

  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={style}
        loading="lazy"
        className={`shrink-0 rounded-full bg-yt-skeleton object-cover ${className}`} />);


  }

  return (
    <span
      aria-hidden="true"
      style={{ ...style, backgroundColor: colorFor(name), fontSize: Math.round(size * 0.42) }}
      className={`flex shrink-0 items-center justify-center rounded-full font-medium uppercase leading-none text-white ${className}`}>
      
      {name.trim().charAt(0) || '?'}
    </span>);

}