/**
 * STYLE STORY — CONSTANTS
 * Single source of truth for table names, storage paths, and
 * fixed values used across repositories and services.
 * ES module — import { X } from './constants.js'
 */

export const TABLES = Object.freeze({
  SETTINGS: 'settings',
  SERVICES: 'services',
  GALLERY: 'gallery',
  TESTIMONIALS: 'testimonials',
  STYLISTS: 'stylists',
  OFFERS: 'offers',
  BOOKINGS: 'bookings',
});

export const STORAGE_BUCKET = 'style-story-media';

export const STORAGE_FOLDERS = Object.freeze({
  GALLERY: 'gallery',
  TEAM: 'team',
  TESTIMONIALS: 'testimonials',
  OFFERS: 'offers',
  HERO: 'hero',
  BRANDING: 'branding',
});

export const BOOKING_STATUS = Object.freeze({
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
});

export const GALLERY_SIZE = Object.freeze({
  SMALL: 'small',
  LARGE: 'large',
});

// Upload constraints — enforced client-side in upload.service.js
// before anything reaches Supabase Storage.
export const UPLOAD_LIMITS = Object.freeze({
  MAX_FILE_SIZE_BYTES: 8 * 1024 * 1024, // 8MB pre-compression ceiling
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  TARGET_MAX_WIDTH_PX: 1920,
  TARGET_MAX_HEIGHT_PX: 1920,
  COMPRESSION_QUALITY: 0.82, // 0–1, used for jpeg/webp re-encode
});

// Booking form validation constraints
export const VALIDATION_LIMITS = Object.freeze({
  NAME_MIN: 2,
  NAME_MAX: 80,
  PHONE_MIN_DIGITS: 10,
  PHONE_MAX_DIGITS: 13,
  NOTES_MAX: 500,
});

// Retry behavior for transient Supabase/network failures
export const RETRY_CONFIG = Object.freeze({
  MAX_ATTEMPTS: 3,
  BASE_DELAY_MS: 400, // exponential backoff: 400ms, 800ms, 1600ms
});