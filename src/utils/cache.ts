import { upstashEnabled, upstashGet, upstashSet } from './upstash';

export const TTL = {
  suggest: 60 * 60 * 1000,
  search: 30 * 60 * 1000,
  trending: 15 * 60 * 1000,
  videos: 12 * 60 * 60 * 1000,
  channels: 12 * 60 * 60 * 1000,
  mine: 30 * 60 * 1000,
  personal: 5 * 60 * 1000
} as const;

interface Entry<T> {
  v: T;
  e: number;
}

const STORAGE_PREFIX = 'ytclone.cache.';
const memory = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/** Personal (signed-in) responses never leave the browser. */
function isShareable(key: string): boolean {
  return !key.startsWith('yt:me:');
}

function storageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function readStored<T>(key: string): Entry<T> | undefined {
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    if (!raw) return undefined;
    return JSON.parse(raw) as Entry<T>;
  } catch {
    return undefined;
  }
}

function prune(): void {
  try {
    const now = Date.now();
    const entries: Array<[string, number]> = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith(STORAGE_PREFIX)) continue;
      try {
        const parsed = JSON.parse(window.localStorage.getItem(key) ?? '{}') as Entry<unknown>;
        if (!parsed.e || parsed.e < now) window.localStorage.removeItem(key);else
        entries.push([key, parsed.e]);
      } catch {
        window.localStorage.removeItem(key);
      }
    }
    if (entries.length > 200) {
      entries.
      sort((a, b) => a[1] - b[1]).
      slice(0, Math.floor(entries.length / 2)).
      forEach(([key]) => window.localStorage.removeItem(key));
    }
  } catch {

    /* storage unavailable */}
}

function writeStored(key: string, entry: Entry<unknown>): void {
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(entry));
  } catch {
    prune();
    try {
      window.localStorage.setItem(storageKey(key), JSON.stringify(entry));
    } catch {

      /* give up silently */}
  }
}

/** Fresh value only — returns undefined once the entry is past its TTL. */
export function cacheGet<T>(key: string): T | undefined {
  const now = Date.now();
  const hit = memory.get(key) as Entry<T> | undefined;
  if (hit) {
    if (hit.e > now) return hit.v;
    memory.delete(key);
  }
  const stored = readStored<T>(key);
  if (stored && stored.e > now) {
    memory.set(key, stored);
    return stored.v;
  }
  return undefined;
}

export function cacheSet<T>(key: string, value: T, ttl: number): void {
  const entry: Entry<T> = { v: value, e: Date.now() + ttl };
  memory.set(key, entry);
  writeStored(key, entry);
  if (upstashEnabled && isShareable(key)) void upstashSet(key, entry, ttl / 1000);
}

/**
 * Cache-first loader with in-flight de-duplication: two components asking for
 * the same key at the same moment trigger a single network request, and public
 * responses are shared through Redis so the API quota lasts.
 */
export async function cached<T>(key: string, ttl: number, loader: () => Promise<T>): Promise<T> {
  const local = cacheGet<T>(key);
  if (local !== undefined) return local;

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const task = (async () => {
    if (upstashEnabled && isShareable(key)) {
      const remote = await upstashGet<Entry<T>>(key);
      if (remote && remote.e > Date.now()) {
        memory.set(key, remote);
        writeStored(key, remote);
        return remote.v;
      }
    }
    const value = await loader();
    cacheSet(key, value, ttl);
    return value;
  })();

  inflight.set(key, task);
  try {
    return await task;
  } finally {
    inflight.delete(key);
  }
}

export function cacheClear(prefix = ''): void {
  for (const key of Array.from(memory.keys())) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(`${STORAGE_PREFIX}${prefix}`)) window.localStorage.removeItem(key);
    }
  } catch {

    /* storage unavailable */}
}