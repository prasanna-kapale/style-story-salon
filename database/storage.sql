-- ============================================================
-- STYLE STORY SALONS — STORAGE BUCKET + POLICIES
-- Run AFTER schema.sql and rls.sql.
--
-- This file is a verbatim extract of the storage section already
-- embedded in schema.sql — kept here too as a separate file only
-- because Supabase's SQL editor / migration tooling is often run
-- file-by-file. If you ever edit storage policies, edit schema.sql's
-- storage section first and re-extract, so the two never drift apart.
--
-- Creates one bucket "style-story-media". Folders (branding/,
-- services/, gallery/, stylists/, offers/, testimonials/, hero/)
-- are just key prefixes — they appear automatically the first time
-- a file is uploaded into them; there is no folder-creation step.
--
-- Policy model:
--   Public (anon + authenticated) -> read (SELECT) only
--   Authenticated (admin)         -> insert, update, delete
-- ============================================================

insert into storage.buckets (id, name, public)
values ('style-story-media', 'style-story-media', true)
on conflict (id) do nothing;

-- Public can read every object in the bucket (so <img> tags work with the public URL).
drop policy if exists "style_story_media_public_read" on storage.objects;
create policy "style_story_media_public_read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'style-story-media');

-- Only the signed-in admin can upload / replace / delete files.
drop policy if exists "style_story_media_admin_insert" on storage.objects;
create policy "style_story_media_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'style-story-media');

drop policy if exists "style_story_media_admin_update" on storage.objects;
create policy "style_story_media_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'style-story-media');

drop policy if exists "style_story_media_admin_delete" on storage.objects;
create policy "style_story_media_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'style-story-media');

-- Folders (branding/, services/, gallery/, stylists/, offers/, testimonials/, hero/) are
-- created automatically the first time a file is uploaded into them — Supabase Storage
-- has no empty-folder concept, so there is nothing to run here for that part.