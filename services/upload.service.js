/**
 * STYLE STORY — UPLOAD SERVICE
 * Handles all image uploads to Supabase Storage:
 *   - client-side compression (canvas re-encode, no server needed)
 *   - collision-proof unique filenames
 *   - deleting the previous file when replacing an image
 *   - returning the public URL for storing on the DB row
 *   - upload progress callback (compression % + upload %)
 *   - file validation before any network call
 */

import { supabase } from '../js/supabase.js';
import { STORAGE_BUCKET, UPLOAD_LIMITS } from '../js/constants.js';
import { generateUniqueFilename, normalizeError, withRetry } from '../js/helpers.js';
import { validateImageFile } from '../js/validators.js';

/**
 * Compresses an image file in-browser via canvas re-encoding.
 * Resizes to fit within TARGET_MAX_WIDTH/HEIGHT (preserving aspect
 * ratio) and re-encodes as JPEG/WebP at COMPRESSION_QUALITY.
 * SVGs and already-tiny files are passed through unchanged.
 *
 * @param {File} file
 * @param {(percent: number) => void} [onProgress] - called with 0-100 during compression
 * @returns {Promise<File>}
 */
export async function compressImage(file, onProgress) {
  if (file.type === 'image/svg+xml') return file; // vector — nothing to compress
  if (file.size < 150 * 1024) {
    // Already small (<150KB) — compressing further isn't worth the
    // quality loss, and avoids re-encoding small icon-like uploads.
    onProgress?.(100);
    return file;
  }

  onProgress?.(10);
  const imageBitmap = await loadImageBitmap(file);
  onProgress?.(40);

  const { width, height } = fitWithinBounds(
    imageBitmap.width,
    imageBitmap.height,
    UPLOAD_LIMITS.TARGET_MAX_WIDTH_PX,
    UPLOAD_LIMITS.TARGET_MAX_HEIGHT_PX
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0, width, height);
  onProgress?.(70);

  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await canvasToBlob(canvas, outputType, UPLOAD_LIMITS.COMPRESSION_QUALITY);
  onProgress?.(95);

  // Only use the compressed version if it's actually smaller —
  // tiny/already-optimized PNGs can occasionally grow when re-encoded.
  const finalBlob = blob.size < file.size ? blob : file;
  const compressedFile = new File([finalBlob], file.name, { type: outputType });
  onProgress?.(100);
  return compressedFile;
}

function loadImageBitmap(file) {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file);
  }
  // Fallback for older browsers without createImageBitmap support
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for compression.'));
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas encoding failed.'))),
      type,
      quality
    );
  });
}

function fitWithinBounds(width, height, maxWidth, maxHeight) {
  if (width <= maxWidth && height <= maxHeight) return { width, height };
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

/**
 * Uploads a file to the given storage folder, returns its public URL.
 * Always generates a fresh unique filename — never trusts the
 * original filename (avoids collisions and path-traversal issues).
 *
 * @param {File} file
 * @param {string} folder - one of STORAGE_FOLDERS, e.g. 'gallery'
 * @param {(percent: number) => void} [onProgress] - 0-100 across the whole operation
 * @returns {Promise<{ publicUrl: string, path: string }>}
 */
export async function uploadImage(file, folder, onProgress) {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }

  onProgress?.(0);
  const compressed = await compressImage(file, (p) => onProgress?.(Math.round(p * 0.5))); // 0-50%
  const filename = generateUniqueFilename(file.name);
  const path = `${folder}/${filename}`;

  onProgress?.(55);

  const { error: uploadError } = await withRetry(async () => {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, compressed, {
        cacheControl: '31536000', // 1 year — filenames are unique, safe to cache forever
        upsert: false,
        contentType: compressed.type,
      });
    if (error) throw normalizeError(error);
    return { data, error: null };
  });
  if (uploadError) throw uploadError;

  onProgress?.(90);

  const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  onProgress?.(100);

  return { publicUrl: urlData.publicUrl, path };
}

/**
 * Replaces an existing image: uploads the new file, then deletes
 * the old one. Upload-first ordering means a failed upload never
 * leaves the record pointing at a deleted file.
 *
 * @param {File} newFile
 * @param {string} folder
 * @param {string|null} oldPublicUrl - previous image_url/photo_url value, or null/empty if none
 * @param {(percent: number) => void} [onProgress]
 * @returns {Promise<{ publicUrl: string, path: string }>}
 */
export async function replaceImage(newFile, folder, oldPublicUrl, onProgress) {
  const result = await uploadImage(newFile, folder, onProgress);
  if (oldPublicUrl) {
    // Best-effort cleanup — if deleting the old file fails (e.g. it
    // was already removed), we don't want that to fail the whole
    // replace operation since the new image is already live.
    await deleteImageByUrl(oldPublicUrl).catch((err) => {
      console.warn('[upload.service] Failed to delete old image:', err.message);
    });
  }
  return result;
}

/**
 * Deletes a stored file by its storage path (e.g. "gallery/16998-ab12.jpg").
 */
export async function deleteImageByPath(path) {
  if (!path) return;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) throw normalizeError(error);
}

/**
 * Deletes a stored file given its full public URL, by extracting
 * the storage path back out of the URL. Convenience wrapper since
 * DB rows store the public URL, not the raw path.
 */
export async function deleteImageByUrl(publicUrl) {
  const path = extractStoragePathFromPublicUrl(publicUrl);
  if (!path) return;
  return deleteImageByPath(path);
}

/**
 * Supabase public URLs look like:
 *   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
 * This pulls <path> back out so we can pass it to storage.remove().
 */
function extractStoragePathFromPublicUrl(publicUrl) {
  if (!publicUrl) return null;
  const marker = `/object/public/${STORAGE_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}
/**
 * Deletes every file in `folder` whose public URL isn't in `referencedUrls`.
 * Used by the admin Settings "clean up unused files" action.
 */
export async function cleanupOrphanedFiles(folder, referencedUrls) {
  const { data: files, error } = await supabase.storage.from(STORAGE_BUCKET).list(folder, { limit: 1000 });
  if (error) throw normalizeError(error);

  const referencedPaths = new Set(
    (referencedUrls || []).filter(Boolean).map((url) => {
      const marker = `/object/public/${STORAGE_BUCKET}/`;
      const idx = url.indexOf(marker);
      return idx === -1 ? null : decodeURIComponent(url.slice(idx + marker.length));
    }).filter(Boolean)
  );

  const orphanPaths = (files || []).map((f) => `${folder}/${f.name}`).filter((p) => !referencedPaths.has(p));
  if (orphanPaths.length === 0) return 0;

  const { error: delError } = await supabase.storage.from(STORAGE_BUCKET).remove(orphanPaths);
  if (delError) throw normalizeError(delError);
  return orphanPaths.length;
}

// Bridge for admin.js (classic global script, no ESM imports there).
window.StyleStoryUpload = {
  compressImage, uploadImage, replaceImage,
  deleteByPublicUrl: deleteImageByUrl,
  cleanupOrphanedFiles,
};