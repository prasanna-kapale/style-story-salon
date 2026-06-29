/**
 * STYLE STORY — BOOKING SERVICE
 * Orchestrates the booking flow: validate input, insert into
 * Supabase, generate the WhatsApp confirmation message and URL.
 *
 * This service NEVER opens WhatsApp itself (no window.open calls).
 * It only returns the URL — the calling UI code decides when and
 * how to navigate to it (e.g. on a button click, in a new tab).
 */

import { supabase } from '../js/supabase.js';
import { TABLES, BOOKING_STATUS } from '../js/constants.js';
import { validateBookingInput } from '../js/validators.js';
import { normalizeError, withRetry, buildWhatsAppUrl, normalizePhoneForWhatsApp } from '../js/helpers.js';
import { WHATSAPP_NUMBER } from '../js/config.js';

/**
 * Validates and creates a booking.
 *
 * @param {{
 *   serviceId?: string,
 *   serviceName: string,
 *   stylistName?: string,
 *   preferredDate: string,   // 'YYYY-MM-DD'
 *   preferredTime: string,
 *   customerName: string,
 *   customerPhone: string,
 *   notes?: string,
 * }} input
 * @returns {Promise<{ bookingId: string, whatsappUrl: string }>}
 * @throws {Error} with a .errors array if validation fails
 */
export async function createBooking(input) {
  const validation = validateBookingInput(input);
  if (!validation.valid) {
    const err = new Error(validation.errors.join(' '));
    err.errors = validation.errors;
    throw err;
  }

  const payload = {
    customer_name: input.customerName.trim(),
    phone: input.customerPhone.trim(),
    service_id: input.serviceId || null,
    stylist_id: input.stylistId || null,
    booking_date: input.preferredDate,
    booking_time: input.preferredTime.trim(),
    notes: input.notes ? input.notes.trim() : null,
    status: BOOKING_STATUS.PENDING,
  };

  const bookingId = await withRetry(async () => {
    const { data, error } = await supabase
      .from(TABLES.BOOKINGS)
      .insert(payload)
      .select('id')
      .single();
    if (error) throw normalizeError(error);
    return data.id;
  });

  const whatsappUrl = buildBookingWhatsAppUrl({
    service_name: input.serviceName,
    stylist_name: input.stylistName,
    preferred_date: input.preferredDate,
    preferred_time: input.preferredTime,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    notes: input.notes,
  });

  return { bookingId, whatsappUrl };
}

/**
 * Builds the WhatsApp deep-link URL with a pre-filled confirmation
 * message, matching the format from the original design brief.
 * Pure function — does not touch the network or open anything.
 */
export function buildBookingWhatsAppUrl(booking, whatsappNumber = WHATSAPP_NUMBER) {
  const message = buildBookingMessage(booking);
  const normalizedNumber = normalizePhoneForWhatsApp(whatsappNumber);
  return buildWhatsAppUrl(normalizedNumber, message);
}

/**
 * Formats the human-readable WhatsApp confirmation message.
 * Exported separately so the UI can preview the message text
 * before generating the full URL, if desired.
 */
export function buildBookingMessage(booking) {
  const lines = [
    'Hello Style Story,',
    '',
    'I would like to book an appointment.',
    '',
    'Service:',
    booking.service_name || booking.serviceName || '',
    '',
    'Preferred Stylist:',
    booking.stylist_name || booking.stylistName || 'No preference',
    '',
    'Preferred Date:',
    booking.preferred_date || booking.preferredDate || '',
    '',
    'Preferred Time:',
    booking.preferred_time || booking.preferredTime || '',
    '',
    'Name:',
    booking.customer_name || booking.customerName || '',
    '',
    'Phone:',
    booking.customer_phone || booking.customerPhone || '',
    '',
    'Additional Notes:',
    booking.notes || '—',
    '',
    'Please confirm my appointment.',
  ];
  return lines.join('\n');
}

/**
 * Admin-side: fetch bookings, optionally filtered by status.
 * (Requires an authenticated session — RLS blocks anon reads.)
 */
export async function getBookings({ status, limit = 50 } = {}) {
  return withRetry(async () => {
    let query = supabase
      .from(TABLES.BOOKINGS)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw normalizeError(error);
    return data;
  });
}

/**
 * Admin-side: update a booking's status (pending -> confirmed, etc).
 */
export async function updateBookingStatus(bookingId, status) {
  if (!Object.values(BOOKING_STATUS).includes(status)) {
    throw new Error(`Invalid status "${status}".`);
  }
  return withRetry(async () => {
    const { data, error } = await supabase
      .from(TABLES.BOOKINGS)
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();
    if (error) throw normalizeError(error);
    return data;
  });
}
/**
 * Bridge for script.js (classic global script): persists the booking,
 * then opens WhatsApp itself (script.js expects this, unlike createBooking).
 */
window.StyleStoryBooking = {
  async submitBooking(booking, brandName, whatsappNumber) {
    const { whatsappUrl } = await createBooking({
      serviceId: booking.serviceId,
      serviceName: booking.serviceName,
      stylistId: booking.stylistId,
      stylistName: booking.stylistName,
      preferredDate: booking.bookingDate,
      preferredTime: booking.bookingTime,
      customerName: booking.customerName,
      customerPhone: booking.phone,
      notes: booking.notes,
    });
    const url = whatsappNumber ? buildBookingWhatsAppUrl({
      service_name: booking.serviceName, stylist_name: booking.stylistName,
      preferred_date: booking.bookingDate, preferred_time: booking.bookingTime,
      customer_name: booking.customerName, customer_phone: booking.phone, notes: booking.notes,
    }, whatsappNumber) : whatsappUrl;
    window.open(url, '_blank');
  },
};