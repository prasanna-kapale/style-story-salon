/**
 * STYLE STORY — HELPERS
 * Small, pure, reusable utility functions shared across
 * repositories and services. No Supabase imports here —
 * keeps this module testable in isolation.
 */

import { RETRY_CONFIG } from './constants.js';

/**
 * Wraps an async function with exponential-backoff retry.
 * Use for transient failures (network blips, brief Supabase 5xx).
 * Does NOT retry on validation errors or 4xx — those are
 * permanent and retrying wastes time / hides real bugs.
 *
 * @param {() => Promise<any>} fn
 * @param {{ maxAttempts?: number, baseDelayMs?: number, isRetryable?: (err) => boolean }} [opts]
 */
export async function withRetry(fn, opts = {}) {
  const maxAttempts = opts.maxAttempts ?? RETRY_CONFIG.MAX_ATTEMPTS;
  const baseDelayMs = opts.baseDelayMs ?? RETRY_CONFIG.BASE_DELAY_MS;
  const isRetryable = opts.isRetryable ?? defaultIsRetryable;

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === maxAttempts;
      if (isLastAttempt || !isRetryable(err)) {
        throw normalizeError(err);
      }
      const delay = baseDelayMs * 2 ** (attempt - 1);
      await sleep(delay);
    }
  }
  // Unreachable, but keeps TypeScript-style tooling happy if added later.
  throw normalizeError(lastError);
}

function defaultIsRetryable(err) {
  // Supabase/PostgREST surfaces network errors without a numeric status,
  // and 5xx for transient server issues. 4xx (bad request, RLS denial,
  // unique violation, etc.) are permanent — never retry those blindly.
  const status = err?.status ?? err?.code;
  if (typeof status === 'number') return status >= 500;
  // PostgREST RLS/permission errors arrive as code 'PGRST301' etc — treat
  // unknown/string codes as non-retryable to avoid masking real errors.
  if (typeof status === 'string') return false;
  // No status at all usually means a network-level failure — retry.
  return true;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normalizes Supabase/PostgREST errors and plain JS errors into a
 * consistent shape so calling code never has to branch on error type.
 */
export function normalizeError(err) {
  if (!err) return new Error('Unknown error');
  if (err instanceof Error) return err;
  const message = err.message || err.error_description || err.msg || 'Unknown error';
  const wrapped = new Error(message);
  wrapped.status = err.status ?? err.code;
  wrapped.details = err.details;
  wrapped.hint = err.hint;
  return wrapped;
}

/**
 * Converts a display name into a URL/DB-safe slug.
 * "Hair Spa & Treatment" -> "hair-spa-treatment"
 */
export function slugify(input) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // strip punctuation
    .replace(/[\s_]+/g, '-')    // spaces/underscores -> hyphen
    .replace(/-+/g, '-')        // collapse repeats
    .replace(/^-|-$/g, '');     // trim leading/trailing hyphen
}

/**
 * Generates a collision-resistant filename for storage uploads.
 * Keeps the original extension, replaces the name with a
 * timestamp + random suffix so two uploads never collide.
 */
export function generateUniqueFilename(originalFilename) {
  const ext = (originalFilename.split('.').pop() || 'jpg').toLowerCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${random}.${ext}`;
}

/**
 * Debounce — used by admin search/filter inputs to avoid
 * firing a Supabase query on every keystroke.
 */
export function debounce(fn, waitMs = 300) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), waitMs);
  };
}

/**
 * Strips non-digit characters from a phone number and ensures
 * it's prefixed correctly for wa.me links (country code, no '+').
 * Assumes Indian numbers by default (91); pass countryCode to override.
 */
export function normalizePhoneForWhatsApp(rawPhone, countryCode = '91') {
  const digitsOnly = String(rawPhone).replace(/\D/g, '');
  if (digitsOnly.startsWith(countryCode) && digitsOnly.length > 10) {
    return digitsOnly;
  }
  // Strip a leading 0 (common in locally-formatted Indian numbers)
  const local = digitsOnly.replace(/^0+/, '');
  return `${countryCode}${local}`;
}

/**
 * Builds a wa.me deep link with a pre-filled, URL-encoded message.
 */
export function buildWhatsAppUrl(phoneWithCountryCode, message) {
  return `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(message)}`;
}

/**
 * Shallow-picks only the provided keys from an object — used before
 * writes to ensure callers can't accidentally smuggle extra columns
 * (e.g. is_active, id) into a create() payload meant for public users.
 */
export function pick(obj, keys) {
  const result = {};
  for (const key of keys) {
    if (obj[key] !== undefined) result[key] = obj[key];
  }
  return result;
}