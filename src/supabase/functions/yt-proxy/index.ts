/**
 * yt-proxy — Supabase Edge Function (Deno)
 *
 * Server-side YouTube Data API gateway with an Upstash Redis cache. Moving the
 * reads here means the API key never reaches the browser and every visitor
 * shares one cache, which is what keeps the 10,000 unit/day quota alive.
 *
 * Deploy locally:
 *   supabase functions serve yt-proxy --no-verify-jwt --env-file ./supabase/.env
 *
 * Deploy remotely:
 *   supabase functions deploy yt-proxy --no-verify-jwt
 *   supabase secrets set --env-file ./supabase/.env
 *
 * ./supabase/.env
 *   YOUTUBE_API_KEY=...
 *   UPSTASH_REDIS_REST_URL=https://tender-sailfish-17272.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN=...
 *
 * Client call:
 *   GET /functions/v1/yt-proxy?path=videos&part=snippet&chart=mostPopular&regionCode=FR
 *   Header X-YouTube-Token: <google oauth token>   (optional, bypasses the cache)
 */

const YOUTUBE_BASE = 'https://www.googleapis.com/youtube/v3';

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY') ?? '';
const UPSTASH_URL = Deno.env.get('UPSTASH_REDIS_REST_URL') ?? '';
const UPSTASH_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') ?? '';

const ALLOWED_PATHS = new Set([
'videos',
'search',
'channels',
'playlists',
'playlistItems',
'commentThreads',
'subscriptions',
'videoCategories']
);

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-youtube-token',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

const TTL_SECONDS: Record<string, number> = {
  videos: 12 * 60 * 60,
  search: 30 * 60,
  channels: 12 * 60 * 60,
  playlists: 30 * 60,
  playlistItems: 30 * 60,
  commentThreads: 30 * 60,
  videoCategories: 7 * 24 * 60 * 60,
  subscriptions: 30 * 60
};

function ttlFor(path: string, params: URLSearchParams): number {
  if (path === 'videos') {
    if (params.get('myRating')) return 5 * 60;
    if (params.get('chart')) return 15 * 60;
  }
  return TTL_SECONDS[path] ?? 30 * 60;
}

async function redisGet(key: string): Promise<string | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const response = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {result?: string | null;};
    return body.result ?? null;
  } catch {
    return null;
  }
}

async function redisSet(key: string, value: string, ttl: number): Promise<void> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return;
  try {
    await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([['SET', key, value, 'EX', String(ttl)]])
    });
  } catch {

    /* cache writes are best effort */}
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extra }
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const incoming = new URL(request.url);
  const path = incoming.searchParams.get('path') ?? '';

  if (!ALLOWED_PATHS.has(path)) {
    return json({ error: `Unsupported path "${path}"` }, 400);
  }

  const params = new URLSearchParams(incoming.searchParams);
  params.delete('path');

  const viewerToken = request.headers.get('x-youtube-token');
  const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const cacheKey = `yt:${viewerToken ? 'me' : 'pub'}:${path}?${sorted.
  map(([key, value]) => `${key}=${value}`).
  join('&')}`;

  // Personal responses are never cached in the shared store.
  if (!viewerToken) {
    const cached = await redisGet(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT', ...CORS_HEADERS }
      });
    }
  }

  const target = new URL(`${YOUTUBE_BASE}/${path}`);
  params.forEach((value, key) => target.searchParams.set(key, value));

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (viewerToken) headers.Authorization = `Bearer ${viewerToken}`;else
  target.searchParams.set('key', YOUTUBE_API_KEY);

  const upstream = await fetch(target.toString(), { headers });
  const payload = await upstream.text();

  if (!upstream.ok) {
    return new Response(payload, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  if (!viewerToken) await redisSet(cacheKey, payload, ttlFor(path, params));

  return new Response(payload, {
    headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS', ...CORS_HEADERS }
  });
});