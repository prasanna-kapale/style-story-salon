/**
 * STYLE STORY — REPOSITORY LAYER
 * ------------------------------------------------------------
 * Every repository here talks to Supabase directly. This is the
 * ONLY layer that imports the Supabase client — UI code (script.js,
 * the admin panel) calls these functions and never touches
 * `supabase` itself. That boundary is what makes it safe to swap
 * Supabase for another backend later without touching the UI.
 *
 * Every repository exposes, where applicable:
 *   getAll(options?)   - list rows (public-safe: only active rows
 *                        unless the caller is authenticated)
 *   getById(id)
 *   getFeatured()
 *   create(input)      - admin only (enforced by RLS, not just here)
 *   update(id, input)  - admin only
 *   delete(id)         - admin only
 *
 * All functions are async and return plain JS objects/arrays —
 * never the raw Supabase response wrapper.
 * ------------------------------------------------------------
 */

import { supabase } from '../js/supabase.js';
import { TABLES } from '../js/constants.js';
import { normalizeError, withRetry, slugify, pick } from '../js/helpers.js';
import {
  validateServiceInput,
  validateTestimonialInput,
  validateStylistInput,
  validateOfferInput,
  validateGalleryInput,
} from '../js/validators.js';

// ----------------------------------------------------------------
// Shared query helpers
// ----------------------------------------------------------------

async function selectAll(table, { orderBy = 'created_at', ascending = false } = {}) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(orderBy, { ascending });
    if (error) throw normalizeError(error);
    return data;
  });
}

async function selectById(table, id) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw normalizeError(error);
    return data;
  });
}

async function selectFeatured(table, { orderBy = 'created_at', ascending = false } = {}) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('featured', true)
      .order(orderBy, { ascending });
    if (error) throw normalizeError(error);
    return data;
  });
}

async function insertRow(table, payload) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select()
      .single();
    if (error) throw normalizeError(error);
    return data;
  }, { isRetryable: () => false }); // validation/constraint errors shouldn't retry
}

async function updateRow(table, id, payload) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw normalizeError(error);
    return data;
  }, { isRetryable: () => false });
}

async function deleteRow(table, id) {
  return withRetry(async () => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw normalizeError(error);
    return true;
  }, { isRetryable: () => false });
}

// ==================================================================
// SERVICES REPOSITORY
// ==================================================================
export const ServicesRepository = {
  async getAll() {
    return selectAll(TABLES.SERVICES);
  },

  async getById(id) {
    return selectById(TABLES.SERVICES, id);
  },

  async getFeatured() {
    return selectFeatured(TABLES.SERVICES);
  },

  async getByCategory(category) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from(TABLES.SERVICES)
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });
      if (error) throw normalizeError(error);
      return data;
    });
  },

  async create(input) {
    const validation = validateServiceInput(input);
    if (!validation.valid) throw new Error(validation.errors.join(' '));

    const payload = pick(input, ['title', 'category', 'description', 'price', 'duration', 'image_url', 'featured', 'active']);
    if (input.slug) payload.slug = input.slug;
    else payload.slug = slugify(input.title);
    return insertRow(TABLES.SERVICES, payload);
  },

  async update(id, input) {
    const payload = pick(input, ['slug', 'title', 'category', 'description', 'price', 'duration', 'image_url', 'featured', 'active']);
    return updateRow(TABLES.SERVICES, id, payload);
  },

  async delete(id) {
    return deleteRow(TABLES.SERVICES, id);
  },
};

// ==================================================================
// GALLERY REPOSITORY
// ==================================================================
export const GalleryRepository = {
  async getAll() {
    return selectAll(TABLES.GALLERY, { orderBy: 'sort_order', ascending: true });
  },

  async getById(id) {
    return selectById(TABLES.GALLERY, id);
  },

  async getFeatured() {
    return selectFeatured(TABLES.GALLERY, { orderBy: 'sort_order', ascending: true });
  },

  async create(input) {
    const validation = validateGalleryInput(input);
    if (!validation.valid) throw new Error(validation.errors.join(' '));

    const payload = pick(input, ['title', 'category', 'image_url', 'featured', 'sort_order']);
    return insertRow(TABLES.GALLERY, payload);
  },

  async update(id, input) {
    const payload = pick(input, ['title', 'category', 'image_url', 'featured', 'sort_order']);
    return updateRow(TABLES.GALLERY, id, payload);
  },

  async delete(id) {
    return deleteRow(TABLES.GALLERY, id);
  },
};

// ==================================================================
// TESTIMONIALS REPOSITORY
// ==================================================================
export const TestimonialsRepository = {
  async getAll() {
    return selectAll(TABLES.TESTIMONIALS);
  },

  async getById(id) {
    return selectById(TABLES.TESTIMONIALS, id);
  },

  async getFeatured() {
    return selectFeatured(TABLES.TESTIMONIALS);
  },

  async create(input) {
    const validation = validateTestimonialInput(input);
    if (!validation.valid) throw new Error(validation.errors.join(' '));

    const payload = pick(input, ['customer_name', 'designation', 'review', 'rating', 'image_url', 'featured']);
    return insertRow(TABLES.TESTIMONIALS, payload);
  },

  async update(id, input) {
    const payload = pick(input, ['customer_name', 'designation', 'review', 'rating', 'image_url', 'featured']);
    return updateRow(TABLES.TESTIMONIALS, id, payload);
  },

  async delete(id) {
    return deleteRow(TABLES.TESTIMONIALS, id);
  },
};

// ==================================================================
// STYLISTS REPOSITORY
// ==================================================================
export const StylistsRepository = {
  async getAll() {
    return selectAll(TABLES.STYLISTS);
  },

  async getById(id) {
    return selectById(TABLES.STYLISTS, id);
  },

  async getFeatured() {
    return selectFeatured(TABLES.STYLISTS);
  },

  async create(input) {
    const validation = validateStylistInput(input);
    if (!validation.valid) throw new Error(validation.errors.join(' '));

    const payload = pick(input, ['name', 'role', 'specialization', 'experience', 'bio', 'image_url', 'instagram', 'featured', 'active']);
    if (!payload.name) payload.name = 'Available on request';
    return insertRow(TABLES.STYLISTS, payload);
  },

  async update(id, input) {
    const payload = pick(input, ['name', 'role', 'specialization', 'experience', 'bio', 'image_url', 'instagram', 'featured', 'active']);
    return updateRow(TABLES.STYLISTS, id, payload);
  },

  async delete(id) {
    return deleteRow(TABLES.STYLISTS, id);
  },
};

// ==================================================================
// OFFERS REPOSITORY
// ==================================================================
export const OffersRepository = {
  async getAll() {
    return selectAll(TABLES.OFFERS);
  },

  async getById(id) {
    return selectById(TABLES.OFFERS, id);
  },

  async getFeatured() {
    return selectFeatured(TABLES.OFFERS);
  },

  /** Offers that are active AND within their date range, if dates are set. */
  async getCurrentlyValid() {
    return withRetry(async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from(TABLES.OFFERS)
        .select('*')
        .eq('active', true)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order('created_at', { ascending: false });
      if (error) throw normalizeError(error);
      return data;
    });
  },

  async create(input) {
    const validation = validateOfferInput(input);
    if (!validation.valid) throw new Error(validation.errors.join(' '));

    const payload = pick(input, ['title', 'description', 'discount', 'image_url', 'start_date', 'end_date', 'featured', 'active']);
    return insertRow(TABLES.OFFERS, payload);
  },

  async update(id, input) {
    const payload = pick(input, ['title', 'description', 'discount', 'image_url', 'start_date', 'end_date', 'featured', 'active']);
    return updateRow(TABLES.OFFERS, id, payload);
  },

  async delete(id) {
    return deleteRow(TABLES.OFFERS, id);
  },
};

// ==================================================================
// SETTINGS REPOSITORY  (singleton row, id = 1)
// ==================================================================
const SETTINGS_ROW_ID = 1;

export const SettingsRepository = {
  /** Raw row passthrough — used by admin.js (form field names == column names). */
  async getAll() {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from(TABLES.SETTINGS)
        .select('*')
        .eq('id', SETTINGS_ROW_ID)
        .maybeSingle();
      if (error) throw normalizeError(error);
      return data;
    });
  },
  async getById() {
    return this.getAll();
  },

  /** Partial update — admin.js sends column names directly. */
  async update(input) {
    const payload = pick(input, [
      'business_name', 'phone', 'whatsapp', 'email', 'address', 'instagram', 'facebook',
      'working_hours', 'hero_image', 'hero_video', 'logo', 'favicon', 'seo_title', 'seo_description',
    ]);
    return withRetry(async () => {
      const { data, error } = await supabase
        .from(TABLES.SETTINGS)
        .update(payload)
        .eq('id', SETTINGS_ROW_ID)
        .select()
        .single();
      if (error) throw normalizeError(error);
      return data;
    }, { isRetryable: () => false });
  },
};

/** camelCase facade for script.js (landing page). */
export async function getSettingsFacade() {
  const row = await SettingsRepository.getAll();
  if (!row) return { brandName: 'Style Story', whatsappNumber: '', phoneDisplay: '', instagramHandle: '', hours: '', address: '' };
  return {
    brandName: row.business_name || 'Style Story',
    whatsappNumber: row.whatsapp || '',
    phoneDisplay: row.phone || '',
    instagramHandle: row.instagram || '',
    hours: row.working_hours || '',
    address: row.address || '',
    seoTitle: row.seo_title || '',
    seoDescription: row.seo_description || '',
    favicon: row.favicon || null,
  };
}

// ==================================================================
// BOOKINGS REPOSITORY
// Note: creating a booking goes through booking.service.js, not here
// directly — that service adds validation + WhatsApp URL generation
// on top of this repository's plain CRUD. Admin reads/writes can use
// either; both ultimately hit the same `bookings` table.
// ==================================================================
export const BookingsRepository = {
  /** Admin only — RLS blocks anon SELECT on bookings. */
  async getAll({ status } = {}) {
    return withRetry(async () => {
      let query = supabase.from(TABLES.BOOKINGS).select('*').order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw normalizeError(error);
      return data;
    });
  },

  async getById(id) {
    return selectById(TABLES.BOOKINGS, id);
  },

  /** Public-safe — RLS allows anon INSERT only. Prefer booking.service.js's
   *  createBooking() instead, which validates input and returns a WhatsApp URL. */
  async create(payload) {
    return insertRow(TABLES.BOOKINGS, payload);
  },

  /** Admin only. */
  async update(id, input) {
    const payload = pick(input, ['status', 'booking_date', 'booking_time', 'notes']);
    return updateRow(TABLES.BOOKINGS, id, payload);
  },

  /** Admin only. */
  async delete(id) {
    return deleteRow(TABLES.BOOKINGS, id);
  },
};
// ==================================================================
// GLOBAL BRIDGE — script.js / admin.js are classic scripts (no ESM
// imports), so expose everything they need on window.StyleStoryRepo.
// ==================================================================
window.StyleStoryRepo = {
  // facade used by the landing page (script.js)
  async getSettings() { return getSettingsFacade(); },
  async getServices() {
    const rows = await ServicesRepository.getAll();
    return rows.filter((r) => r.active).map((r) => ({
      id: r.id, category: r.category, name: r.title, description: r.description || '',
      priceFrom: Number(r.price) || 0, duration: r.duration || '', imageUrl: r.image_url || null,
    }));
  },
  async getGalleryItems() {
    const rows = await GalleryRepository.getAll();
    return rows.map((r) => ({
      id: r.id, label: r.title, category: r.category || '',
      size: r.featured ? 'large' : 'small', imageUrl: r.image_url || null,
    }));
  },
  async getStylists() {
    const rows = await StylistsRepository.getAll();
    return rows.filter((r) => r.active).map((r) => ({
      id: r.id, name: r.name, specialization: r.specialization || '',
      experience: r.experience || '', imageUrl: r.image_url || null,
    }));
  },
  async getTestimonials() {
    const rows = await TestimonialsRepository.getAll();
    return rows.map((r) => ({
      id: r.id, name: r.customer_name, source: r.designation || '', rating: r.rating, text: r.review,
      avatarInitial: (r.customer_name || '?').trim().charAt(0).toUpperCase(), imageUrl: r.image_url || null,
    }));
  },
  async getActiveOffers() {
    const rows = await OffersRepository.getCurrentlyValid();
    return rows.map((r) => ({ id: r.id, title: r.title, description: r.description || '', validTill: r.end_date || '' }));
  },
  // raw repositories used by the admin panel (admin.js)
  ServicesRepository, GalleryRepository, TestimonialsRepository,
  StylistsRepository, OffersRepository, SettingsRepository, BookingsRepository,
};