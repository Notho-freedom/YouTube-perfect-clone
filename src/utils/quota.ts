/**
 * YouTube Data API quota ledger.
 *
 * The public key gets 10,000 units a day, and the costs are wildly uneven:
 * a `search` call is 100 units while a `videos` or `channels` read is 1. A
 * hundred careless searches exhaust the entire day, so spending is metered
 * here rather than discovered when the API starts returning 403.
 *
 * The policy is deliberately simple and predictable:
 *   1. Cache first, always. `utils/cache.ts` resolves from memory, then
 *      localStorage, then Redis, and only a genuine miss reaches this ledger.
 *   2. Expensive endpoints are budgeted separately from cheap ones, so a burst
 *      of searches can never starve the reads that render a watch page.
 *   3. Once a budget is spent, uncached calls are refused locally instead of
 *      being sent. A refusal costs nothing and surfaces as an empty state.
 *   4. The ledger is per calendar day in the viewer's own timezone, persisted
 *      so a reload does not reset it, and self-healing at midnight.
 */

/** Documented unit costs. Anything unlisted is a 1-unit read. */
const COSTS: Record<string, number> = {
  search: 100,
  videos: 1,
  channels: 1,
  playlists: 1,
  playlistItems: 1,
  commentThreads: 1,
  comments: 1,
  subscriptions: 1,
  videoCategories: 1,
  activities: 1
};

/** Total daily allowance for a default Google Cloud project. */
const DAILY_UNITS = 10_000;

/**
 * Reserved for cheap reads. Search is capped below the remainder so that
 * browsing all day can never make a watch page unloadable.
 */
const SEARCH_CEILING = 7_000;

const STORAGE_KEY = 'yt:quota:v1';

interface Ledger {
  day: string;
  spent: number;
  searchSpent: number;
  /** Calls refused locally — surfaced in Settings so the limit is visible. */
  refused: number;
}

function today(): string {
  return new Date().toLocaleDateString('en-CA');
}

function blank(): Ledger {
  return { day: today(), spent: 0, searchSpent: 0, refused: 0 };
}

let ledger: Ledger = read();

function read(): Ledger {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw) as Ledger;
    return parsed.day === today() ? parsed : blank();
  } catch {
    return blank();
  }
}

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
  } catch {

    /* storage unavailable — the in-memory ledger still meters this session */}
}

/** Rolls the ledger over at midnight without needing a reload. */
function current(): Ledger {
  if (ledger.day !== today()) {
    ledger = blank();
    persist();
  }
  return ledger;
}

export function costOf(path: string): number {
  return COSTS[path.split('/')[0]] ?? 1;
}

export class QuotaExceededError extends Error {
  constructor(public readonly path: string) {
    super(`Daily YouTube API quota reached before calling ${path}`);
    this.name = 'QuotaExceededError';
  }
}

/**
 * Called immediately before a network read. Returns false when the call must
 * not be made; the caller turns that into an empty state rather than an error
 * the viewer cannot act on.
 */
export function reserve(path: string): boolean {
  const state = current();
  const cost = costOf(path);
  const isSearch = cost >= 100;

  if (state.spent + cost > DAILY_UNITS) {
    state.refused += 1;
    persist();
    return false;
  }

  if (isSearch && state.searchSpent + cost > SEARCH_CEILING) {
    state.refused += 1;
    persist();
    return false;
  }

  state.spent += cost;
  if (isSearch) state.searchSpent += cost;
  persist();
  return true;
}

export interface QuotaSnapshot {
  spent: number;
  limit: number;
  searchSpent: number;
  searchLimit: number;
  refused: number;
  /** 0–1, for a progress bar. */
  ratio: number;
  exhausted: boolean;
}

export function quotaSnapshot(): QuotaSnapshot {
  const state = current();
  return {
    spent: state.spent,
    limit: DAILY_UNITS,
    searchSpent: state.searchSpent,
    searchLimit: SEARCH_CEILING,
    refused: state.refused,
    ratio: Math.min(1, state.spent / DAILY_UNITS),
    exhausted: state.spent >= DAILY_UNITS
  };
}

/** Used by Settings after clearing caches, and by tests. */
export function resetQuota(): void {
  ledger = blank();
  persist();
}