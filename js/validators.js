/**
 * STYLE STORY — VALIDATORS
 * Pure validation functions. Every validator returns
 * { valid: boolean, errors: string[] } so callers can
 * decide how to surface errors (alert, inline UI, etc.)
 * without this module knowing anything about the DOM.
 */

import { VALIDATION_LIMITS, UPLOAD_LIMITS } from './constants.js';

function result(errors) {
  return { valid: errors.length === 0, errors };
}

export function validateBookingInput(input) {
  const errors = [];
  const { serviceName, customerName, customerPhone, preferredDate, preferredTime, notes } = input || {};

  if (!serviceName || !serviceName.trim()) {
    errors.push('Please choose a service.');
  }

  if (!customerName || customerName.trim().length < VALIDATION_LIMITS.NAME_MIN) {
    errors.push(`Name must be at least ${VALIDATION_LIMITS.NAME_MIN} characters.`);
  } else if (customerName.trim().length > VALIDATION_LIMITS.NAME_MAX) {
    errors.push(`Name must be under ${VALIDATION_LIMITS.NAME_MAX} characters.`);
  }

  const phoneDigits = String(customerPhone || '').replace(/\D/g, '');
  if (phoneDigits.length < VALIDATION_LIMITS.PHONE_MIN_DIGITS || phoneDigits.length > VALIDATION_LIMITS.PHONE_MAX_DIGITS) {
    errors.push('Please enter a valid phone number.');
  }

  if (!preferredDate) {
    errors.push('Please choose a preferred date.');
  } else {
    const chosen = new Date(preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(chosen.getTime())) {
      errors.push('Preferred date is invalid.');
    } else if (chosen < today) {
      errors.push('Preferred date cannot be in the past.');
    }
  }

  if (!preferredTime || !preferredTime.trim()) {
    errors.push('Please choose a preferred time.');
  }

  if (notes && notes.length > VALIDATION_LIMITS.NOTES_MAX) {
    errors.push(`Notes must be under ${VALIDATION_LIMITS.NOTES_MAX} characters.`);
  }

  return result(errors);
}

export function validateServiceInput(input) {
  const errors = [];
  const { title, category, price } = input || {};

  if (!title || !title.trim()) errors.push('Service name is required.');
  if (!category || !category.trim()) errors.push('Category is required.');
  if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
    errors.push('Price must be a non-negative number.');
  }

  return result(errors);
}

export function validateTestimonialInput(input) {
  const errors = [];
  const { customer_name, review, rating } = input || {};

  if (!customer_name || !customer_name.trim()) errors.push('Customer name is required.');
  if (!review || !review.trim()) errors.push('Review text is required.');
  if (rating === undefined || rating === null || ![1, 2, 3, 4, 5].includes(Number(rating))) {
    errors.push('Rating must be between 1 and 5.');
  }

  return result(errors);
}

export function validateStylistInput(input) {
  const errors = [];
  const { specialization } = input || {};
  if (!specialization || !specialization.trim()) {
    errors.push('Specialization is required.');
  }
  return result(errors);
}

export function validateOfferInput(input) {
  const errors = [];
  const { title } = input || {};
  if (!title || !title.trim()) errors.push('Offer title is required.');
  return result(errors);
}

export function validateGalleryInput(input) {
  const errors = [];
  const { title, image_url } = input || {};
  if (!title || !title.trim()) errors.push('Title is required.');
  if (!image_url || !image_url.trim()) errors.push('Image is required — upload one first.');
  return result(errors);
}

/**
 * Validates a File object before it's handed to upload.service.js.
 * Catches obviously-bad files early (wrong type, too large) so we
 * never waste a network round-trip on something that will fail.
 */
export function validateImageFile(file) {
  const errors = [];
  if (!file) {
    errors.push('No file selected.');
    return result(errors);
  }
  if (!UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(file.type)) {
    errors.push(`Unsupported file type "${file.type}". Use JPEG, PNG, WebP, or AVIF.`);
  }
  if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
    const maxMb = (UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0);
    errors.push(`File is too large. Maximum size is ${maxMb}MB.`);
  }
  return result(errors);
}