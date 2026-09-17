import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  BASIC_SCOPES,
  GOOGLE_SCOPES,
  type SignInMode,
  OAUTH_WINDOW_NAME,
  PROVIDER_TOKEN_KEY,
  SIGNIN_MODE_KEY,
  supabase } from
'../utils/supabase';
import { setAuthInvalidHandler, setAuthToken } from '../utils/youtubeApi';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** Google OAuth access token used to call YouTube on the viewer's behalf. */
  providerToken: string | null;
  signedIn: boolean;
  youtubeLinked: boolean;
  loading: boolean;
  authMessage: string | null;
  dismissMessage: () => void;
  signInWithGoogle: (mode?: SignInMode) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(PROVIDER_TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(PROVIDER_TOKEN_KEY, token);else
    window.localStorage.removeItem(PROVIDER_TOKEN_KEY);
  } catch {

    /* storage unavailable */}
}

function readMode(): SignInMode {
  try {
    return window.localStorage.getItem(SIGNIN_MODE_KEY) === 'youtube' ? 'youtube' : 'basic';
  } catch {
    return 'basic';
  }
}

function storeMode(mode: SignInMode | null): void {
  try {
    if (mode) window.localStorage.setItem(SIGNIN_MODE_KEY, mode);else
    window.localStorage.removeItem(SIGNIN_MODE_KEY);
  } catch {

    /* storage unavailable */}
}

export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const [session, setSession] = useState<Session | null>(null);
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const applySession = useCallback((next: Session | null) => {
    setSession(next);

    if (!next) {
      storeToken(null);
      storeMode(null);
      setProviderToken(null);
      setAuthToken(null);
      return;
    }

    const token = next.provider_token ?? readStoredToken();
    if (next.provider_token) storeToken(next.provider_token);
    setProviderToken(token);

    // Only a YouTube-scoped token may be sent to the API. A basic Google token
    // would 403 every request — public reads included — so it is kept out of
    // the API layer entirely, and the public key serves everything.
    setAuthToken(readMode() === 'youtube' ? token : null);
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      applySession(data.session);
      setLoading(false);
      // The OAuth popup lands back on this app: hand the session over and close.
      if (data.session && window.opener && window.name === OAUTH_WINDOW_NAME) {
        window.close();
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
      setLoading(false);
    });

    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key.includes('auth-token') || event.key === PROVIDER_TOKEN_KEY) {
        supabase.auth.getSession().then(({ data }) => applySession(data.session));
      }
    };
    window.addEventListener('storage', onStorage);

    setAuthInvalidHandler(() => {
      storeToken(null);
      setProviderToken(null);
      setAuthMessage('Your YouTube access token expired. Sign in again to reload your account.');
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
      window.removeEventListener('storage', onStorage);
      setAuthInvalidHandler(null);
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [applySession]);

  /**
   * Two sign-in modes.
   *
   * 'youtube' asks for the read-only YouTube scope, which pulls in the real
   * account's subscriptions, likes and playlists — but that scope is still in
   * Google's testing programme, so only allow-listed addresses can grant it.
   * 'basic' asks for identity alone, always works for anyone, and runs on the
   * clone's own native library instead. Nothing else in the app changes.
   */
  const signInWithGoogle = useCallback(async (mode: SignInMode = 'youtube') => {
    setAuthMessage(null);
    storeMode(mode);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: mode === 'youtube' ? GOOGLE_SCOPES : BASIC_SCOPES,
        redirectTo: window.location.origin,
        skipBrowserRedirect: true,
        queryParams:
        mode === 'youtube' ?
        {
          access_type: 'offline',
          prompt: 'consent',
          include_granted_scopes: 'true'
        } :
        { prompt: 'select_account' }
      }
    });

    if (error || !data?.url) {
      setAuthMessage(error?.message ?? 'Could not start Google sign-in.');
      return;
    }

    const framed = window.self !== window.top;
    if (!framed) {
      window.location.assign(data.url);
      return;
    }

    const popup = window.open(data.url, OAUTH_WINDOW_NAME, 'popup,width=520,height=700');
    if (!popup) {
      setAuthMessage('Allow pop-ups for this preview to sign in with Google.');
      return;
    }

    if (pollRef.current) window.clearInterval(pollRef.current);
    const startedAt = Date.now();
    pollRef.current = window.setInterval(async () => {
      const { data: polled } = await supabase.auth.getSession();
      if (polled.session) {
        applySession(polled.session);
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = null;
        if (!popup.closed) popup.close();
        return;
      }
      const elapsed = Date.now() - startedAt;
      if (popup.closed && elapsed > 2000 || elapsed > 180_000) {
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = null;
        setAuthMessage(
          `Sign-in did not complete. Add ${window.location.origin} to Supabase → Authentication → URL Configuration → Redirect URLs.`
        );
      }
    }, 1200);
  }, [applySession]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    applySession(null);
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      // Exposed only when it can actually read YouTube. A basic Google token
      // cannot, so every personal fetch stays unattempted rather than failing
      // with a 403 and showing a misleading "reconnect" prompt.
      providerToken: readMode() === 'youtube' ? providerToken : null,
      signedIn: Boolean(session),
      youtubeLinked: Boolean(providerToken) && readMode() === 'youtube',
      loading,
      authMessage,
      dismissMessage: () => setAuthMessage(null),
      signInWithGoogle,
      signOut
    }),
    [session, providerToken, loading, authMessage, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}