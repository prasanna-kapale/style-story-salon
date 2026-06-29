/**
 * STYLE STORY — AUTH SERVICE
 * Email/password authentication utilities for the admin panel.
 * No UI here — the admin panel (built elsewhere) calls these
 * functions directly and renders its own login form, loading
 * states, and error messages.
 */

import { supabase } from '../js/supabase.js';
import { normalizeError, withRetry } from '../js/helpers.js';

/**
 * Signs in with email + password. Session is persisted
 * automatically by the Supabase client (persistSession: true).
 * @returns {Promise<{ user: object, session: object }>}
 */
export async function signIn(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }
  return withRetry(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw normalizeError(error);
    return data;
  }, { isRetryable: () => false }); // never retry a bad-credentials failure
}

/**
 * Signs out the current admin session.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw normalizeError(error);
}

/**
 * Returns the current session, or null if not logged in.
 * Use this on admin page load to decide whether to show the
 * login form or the dashboard.
 */
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw normalizeError(error);
  return data.session;
}

/**
 * Returns the current authenticated user, or null.
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw normalizeError(error);
  return data.user;
}

/**
 * Subscribes to auth state changes (sign-in, sign-out, token refresh).
 * Returns an unsubscribe function — call it on component teardown.
 *
 * Usage:
 *   const unsubscribe = onAuthStateChange((event, session) => { ... });
 *   // later: unsubscribe();
 */
export function onAuthStateChange(callback) {
  const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => subscription.subscription.unsubscribe();
}

/**
 * Convenience boolean check — true if there's an active session.
 */
export async function isAuthenticated() {
  const session = await getCurrentSession();
  return Boolean(session);
}

/**
 * Sends a password reset email. Supabase handles the redirect
 * flow; pass the URL the user should land on after clicking the
 * email link (your admin panel's reset-password page).
 */
export async function requestPasswordReset(email, redirectTo) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw normalizeError(error);
}

/**
 * Updates the password for the currently authenticated user
 * (used on the reset-password landing page after the email link).
 */
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw normalizeError(error);
}
// Bridge for admin.js (classic global script, no ESM imports there).
window.StyleStoryAuth = { getSession: getCurrentSession, signIn, signOut };