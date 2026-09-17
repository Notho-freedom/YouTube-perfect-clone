import { useEffect, useState } from 'react';

const memory = new Map<string, string | null>();
const STORAGE_KEY = 'ytclone.colors';

/**
 * YouTube thumbnails are already in the HTTP cache without CORS headers by the
 * time we want to read their pixels, and a cached non-CORS response taints the
 * canvas. Sampling the small `default.jpg` variant — which the cards never
 * render — sidesteps that, and it is plenty for an average colour.
 */
function sampleUrl(src: string): string {
  return src.replace(/\/(maxres|sd|hq|mq)default\.jpg/, '/default.jpg');
}

/** Stable 32-bit hash, so the fallback colour never changes between reloads. */
function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

/**
 * Last resort when the pixels are unreadable: a deterministic mid-saturation
 * colour derived from the URL. The glow is part of the design language, so it
 * should still be there even when sampling is blocked.
 */
function fallbackColor(src: string): string {
  const hue = hash(src) % 360;
  const saturation = 0.55;
  const lightness = 0.5;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const sector = hue / 60;
  const secondary = chroma * (1 - Math.abs(sector % 2 - 1));
  const [r, g, b] =
  sector < 1 ?
  [chroma, secondary, 0] :
  sector < 2 ?
  [secondary, chroma, 0] :
  sector < 3 ?
  [0, chroma, secondary] :
  sector < 4 ?
  [0, secondary, chroma] :
  sector < 5 ?
  [secondary, 0, chroma] :
  [chroma, 0, secondary];
  const offset = lightness - chroma / 2;
  return [r, g, b].map((value) => Math.round((value + offset) * 255)).join(', ');
}

function readStored(key: string): string | null | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const map = JSON.parse(raw) as Record<string, string | null>;
    return key in map ? map[key] : undefined;
  } catch {
    return undefined;
  }
}

function writeStored(key: string, value: string | null): void {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const map = raw ? JSON.parse(raw) as Record<string, string | null> : {};
    const keys = Object.keys(map);
    // Keep the store small: colours are cheap to recompute.
    if (keys.length > 400) keys.slice(0, 200).forEach((item) => delete map[item]);
    map[key] = value;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {

    /* storage unavailable */}
}

/**
 * The dominant colour of a thumbnail as an "r, g, b" string.
 *
 * It favours saturated, mid-bright pixels — the colour a viewer actually reads
 * as "the" colour of the cover — then blends it back toward the average so the
 * result never turns neon.
 */
export function useDominantColor(src?: string): string | null {
  const key = src ? sampleUrl(src) : '';
  const [color, setColor] = useState<string | null>(() => {
    if (!key) return null;
    const cached = memory.get(key);
    if (cached !== undefined) return cached;
    const stored = readStored(key);
    if (stored !== undefined) {
      memory.set(key, stored);
      return stored;
    }
    return null;
  });

  useEffect(() => {
    if (!key) return;
    if (memory.has(key)) {
      setColor(memory.get(key) ?? null);
      return;
    }
    const stored = readStored(key);
    if (stored !== undefined) {
      memory.set(key, stored);
      setColor(stored);
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.crossOrigin = 'anonymous';

    const settle = (value: string | null) => {
      if (cancelled) return;
      memory.set(key, value);
      writeStored(key, value);
      setColor(value);
    };

    image.onload = () => {
      if (cancelled) return;
      try {
        const size = 8;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('no 2d context');
        context.drawImage(image, 0, 0, size, size);
        const { data } = context.getImageData(0, 0, size, size);

        let best = { r: 0, g: 0, b: 0, weight: -1 };
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let counted = 0;

        for (let index = 0; index < data.length; index += 4) {
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          if (luminance < 18 || luminance > 242) continue;

          sumR += r;
          sumG += g;
          sumB += b;
          counted += 1;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          const brightness = 1 - Math.abs(luminance / 255 - 0.55) * 1.6;
          const weight = saturation * 0.75 + Math.max(0, brightness) * 0.25;
          if (weight > best.weight) best = { r, g, b, weight };
        }

        if (counted === 0) throw new Error('no usable pixels');

        const avgR = sumR / counted;
        const avgG = sumG / counted;
        const avgB = sumB / counted;
        settle(
          [
          Math.round(best.r * 0.7 + avgR * 0.3),
          Math.round(best.g * 0.7 + avgG * 0.3),
          Math.round(best.b * 0.7 + avgB * 0.3)].
          join(', ')
        );
      } catch {
        settle(fallbackColor(key));
      }
    };

    image.onerror = () => settle(fallbackColor(key));
    image.src = key;

    return () => {
      cancelled = true;
    };
  }, [key]);

  return color;
}