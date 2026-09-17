import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlayer } from '../../contexts/PlayerContext';
import { useDominantColor } from '../../hooks/useDominantColor';

/**
 * YouTube Music's top-of-page wash.
 *
 * The surface is never flat black: a wide, soft bloom of two or three hues
 * sits behind the very top of the page and dissolves into #030303 as the
 * listener scrolls. On YouTube Music the hues vary per session, so a palette
 * is picked per session here too — and once something is playing, the first
 * hue is replaced by the artwork's own colour so the page and the track agree.
 */
const PALETTES: Array<[string, string]> = [
['138, 43, 226', '18, 122, 196'], // violet / blue
['0, 143, 108', '116, 32, 176'], // green / purple
['196, 48, 96', '90, 44, 190'], // magenta / indigo
['12, 132, 176', '176, 60, 44'], // teal / rust
['150, 60, 190', '26, 160, 130'] // orchid / jade
];

/** Rotates the whole set per session, so the app is not always the same hue. */
const SESSION_OFFSET = Math.floor(Math.random() * PALETTES.length);

export function MusicAmbient() {
  const { video } = usePlayer();
  const { pathname } = useLocation();
  const artwork = useDominantColor(video?.thumbnail);

  // Dynamic on two axes: the surface a listener is on picks its own hue pair
  // (stable while they stay there, so it never strobes), and the playing
  // track's artwork overrides the leading hue.
  const [primary, secondary] = useMemo(() => {
    let hash = 0;
    for (let index = 0; index < pathname.length; index += 1) {
      hash = (hash * 31 + pathname.charCodeAt(index)) % 100000;
    }
    const [base, accent] = PALETTES[(hash + SESSION_OFFSET) % PALETTES.length];
    return [artwork ?? base, accent];
  }, [artwork, pathname]);

  return (
    <div
      aria-hidden="true"
      // Absolute, not fixed: the wash belongs to the TOP OF THE PAGE and must
      // scroll away with it. A fixed layer stayed under the whole viewport, so
      // content scrolled across it and lost its own surface.
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[620px] transition-[background] duration-700 ease-out"
      style={{
        // Two blooms offset from each other, then a hard fade to the page
        // colour so the wash only exists at the absolute top.
        background: `
          radial-gradient(78% 62% at 18% -8%, rgba(${primary}, 0.55) 0%, rgba(${primary}, 0) 68%),
          radial-gradient(64% 52% at 82% -14%, rgba(${secondary}, 0.42) 0%, rgba(${secondary}, 0) 70%),
          linear-gradient(180deg, rgba(3, 3, 3, 0) 0%, rgba(3, 3, 3, 0.65) 58%, #030303 100%)
        `
      }} />);


}