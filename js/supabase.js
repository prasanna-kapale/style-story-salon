/**
 * STYLE STORY — SUPABASE CLIENT
 *
 * Single shared client instance, imported by every repository
 * and service. Uses the Supabase JS ESM CDN build since this
 * project has no npm/bundler step — `createClient` works exactly
 * like the npm package, just loaded over a <script type="module"> tag.
 *
 * Only ever uses the ANON key. This file ships to the browser,
 * so anything in here is public — the SERVICE_ROLE key must never
 * appear in this file or any file that loads in index.html/admin.html.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, IS_CONFIGURED } from './config.js';

let _client = null;

export function getSupabaseClient() {
  if (!IS_CONFIGURED) {
    throw new Error(
      '[supabase] Cannot create client — SUPABASE_URL / SUPABASE_ANON_KEY are missing. ' +
      'Set window.__STYLE_STORY_CONFIG__ before loading this module.'
    );
  }
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _client;
}

// Most call sites just want the client directly.
export const supabase = IS_CONFIGURED ? getSupabaseClient() : null;