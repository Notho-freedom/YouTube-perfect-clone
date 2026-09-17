import React from 'react';
import { useDominantColor } from '../../hooks/useDominantColor';

type GlowVariant = 'card' | 'row' | 'tile';

interface HoverGlowProps {
  /** Thumbnail the glow takes its colour from. */
  src?: string;
  variant?: GlowVariant;
  /** Rounding of the row/tile fill, matching the element it sits behind. */
  rounded?: string;
}

/**
 * YouTube's card lighting: on hover, a soft wash of the cover's own dominant
 * colour fades in behind the element. It must stay subtle — the colour reads
 * as light spilling out of the thumbnail, never as a coloured panel.
 *
 * IMPORTANT: the parent must be `group relative isolate`. Without `isolate`
 * the negative z-index escapes the card's stacking context and the glow ends
 * up painted behind the page background, which makes it invisible.
 */
export function HoverGlow({ src, variant = 'card', rounded = 'rounded-xl' }: HoverGlowProps) {
  const rgb = useDominantColor(src);
  if (!rgb) return null;

  if (variant === 'card') {
    // Circumscribed to the card: a 6px bleed and a short blur radius, so the
    // light reads as belonging to THIS card and never washes over the ones
    // beside it. Same containment as the row variant, which is why that one
    // already looked right.
    return (
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1.5 -z-10 rounded-2xl opacity-0 blur-[10px] transition-opacity duration-500 ease-out group-hover:opacity-100"
        style={{
          background: `linear-gradient(180deg, rgba(${rgb}, 0.40) 0%, rgba(${rgb}, 0.32) 52%, rgba(${rgb}, 0.10) 100%)`
        }} />);


  }

  if (variant === 'tile') {
    return (
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-3 -z-10 rounded-full opacity-0 blur-2xl transition-opacity duration-500 ease-out group-hover:opacity-100"
        style={{
          background: `radial-gradient(50% 50% at 50% 50%, rgba(${rgb}, 0.6) 0%, rgba(${rgb}, 0) 70%)`
        }} />);


  }

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute -inset-x-2 -inset-y-1 -z-10 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 ${rounded}`}
      style={{
        background: `linear-gradient(100deg, rgba(${rgb}, 0.26) 0%, rgba(${rgb}, 0.12) 55%, rgba(${rgb}, 0.02) 100%)`
      }} />);


}