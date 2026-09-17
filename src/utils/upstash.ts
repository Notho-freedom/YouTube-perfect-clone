/**
 * Shared cache layer (Upstash Redis REST).
 *
 * Every *public* YouTube response is mirrored here, so the daily API quota is
 * shared across reloads, browsers and devices instead of being burned per
 * visitor. Personal responses (the signed-in viewer's subscriptions, likes,
 * playlists) are deliberately never sent here — they stay in the browser.
 */
export const UPSTASH_REDIS_REST_URL = 'https://tender-sailfish-17272.upstash.io';
export const UPSTASH_REDIS_REST_TOKEN =
'AUN4AAIncDI0OTk2ZWJlODNmOGQ0NGU5OGFiMDMxYjgzNTY0NDU1M3AyMTcyNzI';

export const upstashEnabled = Boolean(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);

const TIMEOUT_MS = 2500;

async function withTimeout<T>(task: (signal: AbortSignal) => Promise<T>): Promise<T | undefined> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await task(controller.signal);
  } catch {
    return undefined;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function upstashGet<T>(key: string): Promise<T | undefined> {
  if (!upstashEnabled) return undefined;

  const raw = await withTimeout(async (signal) => {
    const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
      signal
    });
    if (!response.ok) return undefined;
    const body = (await response.json()) as {result?: string | null;};
    return body.result ?? undefined;
  });

  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export async function upstashSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!upstashEnabled) return;
  const payload = JSON.stringify(value);

  await withTimeout(async (signal) => {
    await fetch(`${UPSTASH_REDIS_REST_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([['SET', key, payload, 'EX', String(Math.max(30, Math.round(ttlSeconds)))]]),
      signal
    });
    return undefined;
  });
}