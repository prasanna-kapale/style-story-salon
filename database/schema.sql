-- ============================================================
-- STYLE STORY SALONS — SUPABASE SCHEMA
-- Run this file once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- updated_at helper trigger
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- TABLE: services
-- ============================================================
create table if not exists services (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  description text,
  category    text not null,
  duration    text,
  price       numeric(10,2) not null default 0,
  featured    boolean not null default false,
  active      boolean not null default true,
  image_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_services_updated_at on services;
create trigger trg_services_updated_at before update on services
  for each row execute function set_updated_at();

create index if not exists idx_services_category on services(category);
create index if not exists idx_services_active on services(active);

-- Admin panel only collects a title, not a slug — generate one automatically
-- (and keep it unique) so inserts from the admin never fail on this column.
create or replace function services_generate_slug()
returns trigger as $$
declare
  base_slug text;
  candidate text;
  suffix int := 0;
begin
  if new.slug is null or btrim(new.slug) = '' then
    base_slug := lower(regexp_replace(coalesce(new.title, 'service'), '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then base_slug := 'service'; end if;
    candidate := base_slug;
    while exists (select 1 from services where slug = candidate and id is distinct from new.id) loop
      suffix := suffix + 1;
      candidate := base_slug || '-' || suffix;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_services_generate_slug on services;
create trigger trg_services_generate_slug before insert or update on services
  for each row execute function services_generate_slug();

-- ============================================================
-- TABLE: gallery
-- ============================================================
create table if not exists gallery (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  image_url   text,
  category    text,
  featured    boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_gallery_sort on gallery(sort_order);

-- ============================================================
-- TABLE: testimonials
-- ============================================================
create table if not exists testimonials (
  id            uuid primary key default gen_random_uuid(),
  customer_name text not null,
  designation   text,
  review        text not null,
  rating        smallint not null default 5 check (rating between 1 and 5),
  image_url     text,
  featured      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- TABLE: stylists
-- ============================================================
create table if not exists stylists (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  role            text,
  experience      text,
  specialization  text,
  bio             text,
  instagram       text,
  image_url       text,
  featured        boolean not null default false,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_stylists_updated_at on stylists;
create trigger trg_stylists_updated_at before update on stylists
  for each row execute function set_updated_at();

-- ============================================================
-- TABLE: offers
-- ============================================================
create table if not exists offers (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  discount    text,
  image_url   text,
  start_date  date,
  end_date    date,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_offers_updated_at on offers;
create trigger trg_offers_updated_at before update on offers
  for each row execute function set_updated_at();

-- ============================================================
-- TABLE: bookings
-- ============================================================
do $$ begin
  create type booking_status as enum ('Pending','Confirmed','Completed','Cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists bookings (
  id             uuid primary key default gen_random_uuid(),
  customer_name  text not null,
  phone          text not null,
  service_id     uuid references services(id) on delete set null,
  stylist_id     uuid references stylists(id) on delete set null,
  booking_date   date not null,
  booking_time   text not null,
  notes          text,
  whatsapp_sent  boolean not null default false,
  status         booking_status not null default 'Pending',
  created_at     timestamptz not null default now()
);

create index if not exists idx_bookings_date on bookings(booking_date);
create index if not exists idx_bookings_status on bookings(status);

-- ============================================================
-- TABLE: settings  (singleton row, id is always 1)
-- ============================================================
create table if not exists settings (
  id                 integer primary key default 1,
  business_name      text default 'Style Story',
  phone              text,
  whatsapp           text,
  email              text,
  address            text,
  instagram          text,
  facebook           text,
  working_hours      text,
  hero_image         text,
  hero_video         text,
  logo               text,
  favicon            text,
  seo_title          text,
  seo_description    text,
  updated_at         timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

drop trigger if exists trg_settings_updated_at on settings;
create trigger trg_settings_updated_at before update on settings
  for each row execute function set_updated_at();

insert into settings (id) values (1) on conflict (id) do nothing;

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
-- STORAGE: bucket + folders + policies
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