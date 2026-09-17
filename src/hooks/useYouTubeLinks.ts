import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** Maps a youtube.com URL onto this clone's own route, when one exists. */
export function toInternalRoute(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw, window.location.origin);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\.|^m\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1);
    return id ? `/watch?v=${encodeURIComponent(id)}` : null;
  }
  if (host !== 'youtube.com' && host !== 'music.youtube.com') return null;

  const path = url.pathname;
  const music = host === 'music.youtube.com';

  if (path === '/watch') {
    const id = url.searchParams.get('v');
    if (!id) return null;
    const list = url.searchParams.get('list');
    if (music) return '/music/player';
    return `/watch?v=${encodeURIComponent(id)}${list ? `&list=${encodeURIComponent(list)}` : ''}`;
  }
  if (path === '/playlist') {
    const list = url.searchParams.get('list');
    if (!list) return null;
    return `${music ? '/music' : ''}/playlist?list=${encodeURIComponent(list)}`;
  }
  if (path === '/results' || path === '/search') {
    const query = url.searchParams.get('search_query') ?? url.searchParams.get('q') ?? '';
    if (!query) return null;
    return music ?
    `/music/search?q=${encodeURIComponent(query)}` :
    `/results?search_query=${encodeURIComponent(query)}`;
  }
  if (path.startsWith('/channel/')) {
    const id = path.split('/')[2];
    return id ? `${music ? '/music/artist/' : '/channel/'}${id}` : null;
  }
  if (path.startsWith('/shorts/')) {
    const id = path.split('/')[2];
    return id ? `/shorts?v=${encodeURIComponent(id)}` : null;
  }
  if (path === '/feed/subscriptions') return '/feed/subscriptions';
  if (path === '/feed/history') return '/feed/history';
  if (path === '/feed/playlists') return '/feed/playlists';
  if (path === '/feed/you') return '/feed/you';
  if (path === '/playlist?list=WL') return '/feed/watch-later';
  if (path === '/' || path === '') return music ? '/music' : '/';

  return null;
}

/**
 * Keeps YouTube links inside the clone.
 *
 * Two escape routes are closed here: anchors pointing at youtube.com anywhere
 * in the tree, and `window.open` calls aimed at it. A third — the end screen
 * *inside* the embedded player — cannot be intercepted, because the iframe is
 * cross-origin; that one is handled instead by advancing the queue ourselves
 * so YouTube's end screen never appears.
 */
export function useYouTubeLinks(): void {
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest('a');
      const href = anchor?.getAttribute('href');
      if (!href) return;

      const internal = toInternalRoute(href);
      if (!internal) return;

      event.preventDefault();
      navigate(internal);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [navigate]);

  useEffect(() => {
    const original = window.open;
    window.open = ((url?: string | URL, ...rest: unknown[]) => {
      const internal = typeof url === 'string' ? toInternalRoute(url) : null;
      if (internal) {
        navigate(internal);
        return null;
      }
      return (original as typeof window.open).call(
        window,
        url as string,
        ...(rest as [string?, string?])
      );
    }) as typeof window.open;

    return () => {
      window.open = original;
    };
  }, [navigate]);
}