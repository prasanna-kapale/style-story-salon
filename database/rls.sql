-- ============================================================
-- STYLE STORY SALONS — ROW LEVEL SECURITY
-- Run AFTER schema.sql. Safe to re-run (drops + recreates policies).
--
-- This file is a verbatim extract of the RLS section already
-- embedded in schema.sql — kept here too as a separate file only
-- because Supabase's SQL editor / migration tooling is often run
-- file-by-file. If you ever edit policies, edit schema.sql's RLS
-- section first and re-extract, so the two never drift apart again.
--
-- Model:
--   anon (public)         -> read all rows of content tables;
--                            INSERT-only on bookings
--   authenticated (admin) -> full read/write on every table
-- ============================================================

-- ROW LEVEL SECURITY
-- Public  -> anonymous + logged-out visitors on the landing page (role "anon")
-- Admin   -> the single signed-in salon-owner account (role "authenticated")
-- ============================================================
alter table services      enable row level security;
alter table gallery       enable row level security;
alter table testimonials  enable row level security;
alter table stylists      enable row level security;
alter table offers        enable row level security;
alter table bookings      enable row level security;
alter table settings      enable row level security;

-- ---- services ----
drop policy if exists "services_public_read" on services;
create policy "services_public_read" on services for select to anon using (true);
drop policy if exists "services_admin_read" on services;
create policy "services_admin_read" on services for select to authenticated using (true);
drop policy if exists "services_admin_write" on services;
create policy "services_admin_write" on services for insert to authenticated with check (true);
drop policy if exists "services_admin_update" on services;
create policy "services_admin_update" on services for update to authenticated using (true) with check (true);
drop policy if exists "services_admin_delete" on services;
create policy "services_admin_delete" on services for delete to authenticated using (true);

-- ---- gallery ----
drop policy if exists "gallery_public_read" on gallery;
create policy "gallery_public_read" on gallery for select to anon using (true);
drop policy if exists "gallery_admin_read" on gallery;
create policy "gallery_admin_read" on gallery for select to authenticated using (true);
drop policy if exists "gallery_admin_write" on gallery;
create policy "gallery_admin_write" on gallery for insert to authenticated with check (true);
drop policy if exists "gallery_admin_update" on gallery;
create policy "gallery_admin_update" on gallery for update to authenticated using (true) with check (true);
drop policy if exists "gallery_admin_delete" on gallery;
create policy "gallery_admin_delete" on gallery for delete to authenticated using (true);

-- ---- testimonials ----
drop policy if exists "testimonials_public_read" on testimonials;
create policy "testimonials_public_read" on testimonials for select to anon using (true);
drop policy if exists "testimonials_admin_read" on testimonials;
create policy "testimonials_admin_read" on testimonials for select to authenticated using (true);
drop policy if exists "testimonials_admin_write" on testimonials;
create policy "testimonials_admin_write" on testimonials for insert to authenticated with check (true);
drop policy if exists "testimonials_admin_update" on testimonials;
create policy "testimonials_admin_update" on testimonials for update to authenticated using (true) with check (true);
drop policy if exists "testimonials_admin_delete" on testimonials;
create policy "testimonials_admin_delete" on testimonials for delete to authenticated using (true);

-- ---- stylists ----
drop policy if exists "stylists_public_read" on stylists;
create policy "stylists_public_read" on stylists for select to anon using (true);
drop policy if exists "stylists_admin_read" on stylists;
create policy "stylists_admin_read" on stylists for select to authenticated using (true);
drop policy if exists "stylists_admin_write" on stylists;
create policy "stylists_admin_write" on stylists for insert to authenticated with check (true);
drop policy if exists "stylists_admin_update" on stylists;
create policy "stylists_admin_update" on stylists for update to authenticated using (true) with check (true);
drop policy if exists "stylists_admin_delete" on stylists;
create policy "stylists_admin_delete" on stylists for delete to authenticated using (true);

-- ---- offers ----
drop policy if exists "offers_public_read" on offers;
create policy "offers_public_read" on offers for select to anon using (true);
drop policy if exists "offers_admin_read" on offers;
create policy "offers_admin_read" on offers for select to authenticated using (true);
drop policy if exists "offers_admin_write" on offers;
create policy "offers_admin_write" on offers for insert to authenticated with check (true);
drop policy if exists "offers_admin_update" on offers;
create policy "offers_admin_update" on offers for update to authenticated using (true) with check (true);
drop policy if exists "offers_admin_delete" on offers;
create policy "offers_admin_delete" on offers for delete to authenticated using (true);

-- ---- settings ----
drop policy if exists "settings_public_read" on settings;
create policy "settings_public_read" on settings for select to anon using (true);
drop policy if exists "settings_admin_read" on settings;
create policy "settings_admin_read" on settings for select to authenticated using (true);
drop policy if exists "settings_admin_update" on settings;
create policy "settings_admin_update" on settings for update to authenticated using (true) with check (true);

-- ---- bookings ----
-- Public (anon) may INSERT a booking only — never read, update or delete.
drop policy if exists "bookings_public_insert" on bookings;
create policy "bookings_public_insert" on bookings for insert to anon with check (true);
-- Admin has full control.
drop policy if exists "bookings_admin_read" on bookings;
create policy "bookings_admin_read" on bookings for select to authenticated using (true);
drop policy if exists "bookings_admin_write" on bookings;
create policy "bookings_admin_write" on bookings for insert to authenticated with check (true);
drop policy if exists "bookings_admin_update" on bookings;
create policy "bookings_admin_update" on bookings for update to authenticated using (true) with check (true);
drop policy if exists "bookings_admin_delete" on bookings;
create policy "bookings_admin_delete" on bookings for delete to authenticated using (true);

-- ============================================================