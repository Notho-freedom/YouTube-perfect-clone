import React, { useEffect, useState } from 'react';

interface LikeBurstProps {
  /** Flip to true at the moment of liking; the burst plays once. */
  active: boolean;
  children: React.ReactNode;
}

/**
 * The little spray of petals YouTube fires out of the like button.
 *
 * Eight marks, each on its own vector, fading as they travel. It plays for
 * 600ms and then removes itself from the DOM, so nothing lingers behind the
 * button between presses. Honours prefers-reduced-motion through the CSS.
 */
const PETALS = Array.from({ length: 8 }, (_, index) => {
  const angle = index / 8 * Math.PI * 2 - Math.PI / 2;
  return {
    x: `${Math.cos(angle) * 22}px`,
    y: `${Math.sin(angle) * 22}px`,
    delay: `${index * 12}ms`
  };
});

export function LikeBurst({ active, children }: LikeBurstProps) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!active) return;
    setPlaying(true);
    const timer = window.setTimeout(() => setPlaying(false), 620);
    return () => window.clearTimeout(timer);
  }, [active]);

  return (
    <span className="relative inline-flex">
      {children}
      {playing &&
      <span aria-hidden="true" className="pointer-events-none absolute inset-0">
          {PETALS.map((petal, index) =>
        <span
          key={index}
          className="yt-petal absolute left-1/2 top-1/2 h-[5px] w-[5px] rounded-full bg-yt-blue"
          style={
          {
            '--yt-petal-x': petal.x,
            '--yt-petal-y': petal.y,
            animationDelay: petal.delay
          } as React.CSSProperties
          } />

        )}
        </span>
      }
    </span>);

}