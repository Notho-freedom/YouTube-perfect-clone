import { cached, TTL } from './cache';
import { REGION_CODE, searchVideos } from './youtubeApi';

const SUGGEST_HOST = 'https://suggestqueries-clients6.youtube.com/complete/search';

interface SuggestPayload extends Array<unknown> {
  0: string;
  1: Array<[string, ...unknown[]]>;
}

/** YouTube's own suggestion endpoint only answers via JSONP from a browser. */
function jsonpSuggest(query: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const callbackName = `ytSuggest_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');

    const cleanup = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      script.remove();
    };

    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('suggest timeout'));
    }, 3500);

    (window as unknown as Record<string, unknown>)[callbackName] = (payload: SuggestPayload) => {
      window.clearTimeout(timer);
      cleanup();
      const items = Array.isArray(payload?.[1]) ? payload[1] : [];
      resolve(
        items.
        map((item) => Array.isArray(item) ? String(item[0] ?? '') : '').
        filter((text) => text.length > 0).
        slice(0, 12)
      );
    };

    script.onerror = () => {
      window.clearTimeout(timer);
      cleanup();
      reject(new Error('suggest blocked'));
    };

    const params = new URLSearchParams({
      client: 'youtube',
      ds: 'yt',
      hl: 'fr',
      gl: REGION_CODE,
      q: query,
      jsonp: callbackName,
      callback: callbackName
    });
    script.src = `${SUGGEST_HOST}?${params.toString()}`;
    document.body.appendChild(script);
  });
}

/** Fallback when the suggestion endpoint is unreachable: shorten real titles. */
async function titleSuggest(query: string): Promise<string[]> {
  const videos = await searchVideos(query, 10).catch(() => []);
  const seen = new Set<string>();
  const suggestions: string[] = [];
  for (const video of videos) {
    const phrase = video.title.
    toLowerCase().
    replace(/[|•()[\]"']/g, ' ').
    split(/\s+/).
    slice(0, 6).
    join(' ').
    trim();
    if (phrase.length < query.length || seen.has(phrase)) continue;
    seen.add(phrase);
    suggestions.push(phrase);
    if (suggestions.length === 10) break;
  }
  return suggestions;
}

export async function fetchSuggestions(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];
  return cached(`suggest:${trimmed.toLowerCase()}`, TTL.suggest, async () => {
    try {
      const remote = await jsonpSuggest(trimmed);
      if (remote.length > 0) return remote;
    } catch {

      /* fall through to the title-based fallback */}
    return titleSuggest(trimmed);
  });
}