/**
 * STYLE STORY — RUNTIME CONFIG
 *
 * This is a static HTML/CSS/JS site with no build step, so there is
 * no `process.env` available in the browser. Environment variables
 * are instead injected via a small inline <script> block in the HTML
 * BEFORE this module loads, e.g.:
 *
 *   <script>
 *     window.__STYLE_STORY_CONFIG__ = {
 *       SUPABASE_URL: "https://xxxx.supabase.co",
 *       SUPABASE_ANON_KEY: "eyJ...",
 *       WHATSAPP_NUMBER: "91XXXXXXXXXX"
 *     };
 *   </script>
 *   <script type="module" src="repository.js"></script>
 *
 * On Netlify, these values can be injected at deploy time via a
 * build step (e.g. Netlify Snippet Injection, or a tiny build
 * script that writes this block from Netlify environment variables).
 * Until then, edit env.template.js directly for local/manual use.
 *
 * IMPORTANT: only the ANON key belongs in the browser. The
 * SERVICE_ROLE key must NEVER be referenced from any file that
 * ships to the client — it bypasses RLS entirely. It exists only
 * for server-side/admin tooling you run yourself (e.g. a one-off
 * migration script run with Node), never in index.html or admin.html.
 */

const runtimeConfig = (typeof window !== 'undefined' && window.__STYLE_STORY_CONFIG__) || {};

function requireConfigValue(key, fallbackHint) {
  const value = runtimeConfig[key];
  if (!value) {
    console.error(
      `[config] Missing "${key}". ${fallbackHint || ''}\n` +
      `Set window.__STYLE_STORY_CONFIG__.${key} in a <script> tag before loading repository.js.`
    );
  }
  return value || '';
}

export const SUPABASE_URL = requireConfigValue(
  'SUPABASE_URL',
  'This is your Supabase project URL (Project Settings → API → Project URL).'
);

export const SUPABASE_ANON_KEY = requireConfigValue(
  'SUPABASE_ANON_KEY',
  'This is your Supabase anon/public key (Project Settings → API → anon public).'
);

export const WHATSAPP_NUMBER = runtimeConfig.WHATSAPP_NUMBER || '';

// Convenience flag — lets repository.js / UI code detect a
// misconfigured deployment early instead of failing on first query.
export const IS_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);