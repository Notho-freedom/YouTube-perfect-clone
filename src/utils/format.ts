import { formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale';

export type AppLocale = 'en' | 'fr';

/**
 * Module-level locale, set once by AppProvider.
 *
 * It lives outside React because formatting is called from plain helpers all
 * over the app; threading a hook through every call site would mean touching
 * every component that prints a view count.
 */
let activeLocale: AppLocale = 'en';

export function setAppLocale(locale: AppLocale): void {
  activeLocale = locale;
}

export function getAppLocale(): AppLocale {
  return activeLocale;
}

const UNITS: Array<[number, string]> = [
[1e9, 'B'],
[1e6, 'M'],
[1e3, 'K']];


/** 1_845_000_000 -> "1.8B" (YouTube view-count rounding) */
export function compact(value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '';
  if (value < 1000) return String(value);
  for (const [divisor, suffix] of UNITS) {
    if (value >= divisor) {
      const scaled = value / divisor;
      const truncated = Math.floor(scaled * 10) / 10;
      const text =
      truncated >= 100 ? String(Math.floor(truncated)) : truncated.toFixed(1).replace(/\.0$/, '');
      return `${text}${suffix}`;
    }
  }
  return String(value);
}

/** 4_540_000 -> "4.54M" (YouTube subscriber-count rounding, 3 significant digits) */
export function compactPrecise(value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '';
  if (value < 1000) return String(value);
  for (const [divisor, suffix] of UNITS) {
    if (value >= divisor) {
      const scaled = value / divisor;
      const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
      const truncated = Math.floor(scaled * 10 ** decimals) / 10 ** decimals;
      return `${truncated.toFixed(decimals)}${suffix}`;
    }
  }
  return String(value);
}

export function formatFull(value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '';
  return value.toLocaleString(activeLocale === 'fr' ? 'fr-FR' : 'en-US');
}

export function viewsLabel(value?: number): string {
  if (value === undefined || value === null) return '';
  if (activeLocale === 'fr') return `${compact(value)} vues`;
  return `${compact(value)} view${value === 1 ? '' : 's'}`;
}

export function timeAgo(isoDate?: string): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  if (activeLocale === 'fr') {
    return `il y a ${formatDistanceToNowStrict(date, { addSuffix: false, locale: fr })}`;
  }
  return `${formatDistanceToNowStrict(date, { addSuffix: false })} ago`;
}

export function fullDate(isoDate?: string): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "PT1H16M15S" -> "1:16:15" */
export function formatDuration(iso?: string): string {
  if (!iso) return '';
  const match = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return '';
  const [, d, h, m, s] = match;
  const days = Number(d ?? 0);
  const hours = Number(h ?? 0) + days * 24;
  const minutes = Number(m ?? 0);
  const seconds = Number(s ?? 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

/** "PT1H16M15S" -> 4575 seconds. Used to turn watch time into progress. */
export function durationToSeconds(iso?: string): number {
  if (!iso) return 0;
  const match = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return 0;
  const [, d, h, m, s] = match;
  return Number(d ?? 0) * 86400 + Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
}

export function clockTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}