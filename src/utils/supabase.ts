import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://zwizipjggvnwcvycdrhn.supabase.co';

export const SUPABASE_ANON_KEY =
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3aXppcGpnZ3Zud2N2eWNkcmhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzE4NDYsImV4cCI6MjEwNTE0Nzg0Nn0.wsvPU_MO_mbjAZ8QUIqwOExA3XfYKWbuDlroSeTU29o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

/** Read-only access to the viewer's YouTube account plus basic profile. */
export const GOOGLE_SCOPES = [
'openid',
'email',
'profile',
'https://www.googleapis.com/auth/youtube.readonly'].
join(' ');

/**
 * Identity only. Anyone can grant these, with no Google verification review —
 * the fallback for visitors who are not on the YouTube scope's test list.
 */
export const BASIC_SCOPES = ['openid', 'email', 'profile'].join(' ');

export type SignInMode = 'youtube' | 'basic';

/** Name given to the OAuth popup so the redirected document can close itself. */
export const OAUTH_WINDOW_NAME = 'youtube-clone-oauth';

export const PROVIDER_TOKEN_KEY = 'youtube-clone.provider-token';

/**
 * Which scope set the viewer granted.
 *
 * This matters: a 'basic' sign-in still yields a Google access token, but that
 * token carries no YouTube scope. Sending it to the YouTube API produces a 403
 * on EVERY call — including the public ones — which would take the whole app
 * offline for anyone not on the test list. So the token is only ever attached
 * when the mode recorded here is 'youtube'.
 */
export const SIGNIN_MODE_KEY = 'youtube-clone.signin-mode';