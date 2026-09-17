import React from 'react';

interface ShortsIconProps {
  className?: string;
  /** Red filled badge version used by the Shorts shelf header. */
  filled?: boolean;
}

export function ShortsIcon({ className = 'h-6 w-6', filled = false }: ShortsIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M17.77 10.32l-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06-.97-1.83-3.24-2.53-5.07-1.56L5.1 7.35c-1.5.79-2.29 2.5-1.93 4.16.36 1.67 1.75 2.9 3.44 3.05l1.2.5L6.4 15.5c-1.84.96-2.53 3.23-1.56 5.06.97 1.83 3.24 2.53 5.07 1.56l9.39-4.91c1.5-.79 2.29-2.5 1.93-4.16-.36-1.67-1.75-2.9-3.46-2.73z"
        fill={filled ? '#ff0000' : 'currentColor'} />
      
      <path d="M10 15.44V8.56L16 12l-6 3.44z" fill={filled ? '#ffffff' : 'var(--yt-bg)'} />
    </svg>);

}