-- ============================================================
-- COVO PROJECTS — Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- Drop existing (safe re-run during setup)
drop table if exists project_materials cascade;
drop table if exists unit_layouts cascade;
drop table if exists units cascade;
drop table if exists payment_plans cascade;
drop table if exists projects cascade;
drop table if exists developers cascade;

-- ============================================================
-- 1) DEVELOPERS
-- ============================================================
create table developers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  logo_url    text,
  website     text,
  phone       text,
  created_at  timestamptz default now()
);

-- ============================================================
-- 2) PROJECTS
-- ============================================================
create table projects (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  phase           text,
  developer_id    uuid references developers(id) on delete set null,
  developer_name  text,                          -- denormalized for fast display
  city            text,                          -- New Cairo, North Coast, etc
  location        text,                          -- Al Bassiony, 6th Settlement
  area            text,                          -- sub-area / compound
  acres           numeric,                       -- مساحة المشروع بالفدان
  type            text default 'residential',    -- residential | commercial
  status          text default 'available',      -- available | coming_soon | sold_out
  start_price     numeric,                       -- أقل سعر (يتحسب من الـ units)
  launch_date     date,                          -- تاريخ إطلاق المشروع
  delivery_years  numeric,                       -- سنين الاستلام
  delivery_label  text,                          -- "3 Years", "RTM", etc
  cash_discount   numeric default 0,             -- نسبة خصم الكاش %
  maintenance_pct numeric default 0,             -- نسبة الصيانة %
  club_fees       text,                          -- "Free" or amount
  parking_fees    numeric default 0,
  booking_type    text,                          -- "By Action" | "By Meeting"
  description     text,
  logo_url        text,
  brochure_url    text,                          -- PDF الـ Brochure الكامل
  masterplan_url  text,                          -- صورة الـ Master Plan
  location_url    text,                          -- Google Maps link
  location_lat    numeric,
  location_lng    numeric,
  images          text[] default '{}',           -- gallery images
  has_offer       boolean default false,
  is_featured     boolean default false,
  source          text,                          -- 'mountain_view' | 'madinet_masr' | 'whatsapp' | 'manual'
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_projects_city   on projects(city);
create index idx_projects_type   on projects(type);
create index idx_projects_status on projects(status);
create index idx_projects_dev    on projects(developer_id);

-- ============================================================
-- 3) PAYMENT PLANS  (multiple per project)
-- ============================================================
create table payment_plans (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid references projects(id) on delete cascade,
  down_payment_pct  numeric,                     -- 10, 20, 30...
  years             numeric,                     -- 7, 8, 10, 12...
  discount_pct      numeric default 0,           -- خصم الخطة %
  payment_type      text default 'equal',        -- equal | backloaded
  monthly_after     text,                        -- "1.5% after 1 month" details
  label             text,                        -- display: "10% DP / 10 Years"
  sort_order        int default 0,
  created_at        timestamptz default now()
);

create index idx_plans_project on payment_plans(project_id);

-- ============================================================
-- 4) UNITS  (availability — comes from Excel/WhatsApp import)
-- ============================================================
create table units (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid references projects(id) on delete cascade,
  unit_code       text,                          -- LV-SM-TH-181-B
  unit_price      numeric,
  status          text default 'available',      -- available | reserved | sold
  category        text,                          -- Town House, Garden Millennial, I-Villa...
  unit_type       text,                          -- normalized: apartment/villa/townhouse/twin
  bedrooms        int,
  bua             numeric,                        -- Built Up Area (m²)
  garden_area     numeric default 0,
  roof_area       numeric default 0,
  land_area       numeric default 0,
  floor_no        text,
  building        text,
  park            text,                           -- sub-zone within project
  phase           text,
  model           text,                           -- model description
  entrance        text,
  delivery_status text,                            -- OFF PLAN - 4, READY TO MOVE - 3
  layout_id       uuid,                            -- FK to unit_layouts (set after matching)
  layout_override boolean default false,           -- true = manually linked, don't auto-rematch
  source_file     text,                            -- which import file
  raw             jsonb,                            -- original row for reference
  imported_at     timestamptz default now()
);

create index idx_units_project  on units(project_id);
create index idx_units_category on units(category);
create index idx_units_bua      on units(bua);
create index idx_units_status   on units(status);

-- ============================================================
-- 5) UNIT LAYOUTS  (floor plans extracted from brochure)
-- ============================================================
create table unit_layouts (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references projects(id) on delete cascade,
  name          text,                              -- "Millennial Garden 3BR"
  category      text,                              -- matches units.category
  bedrooms      int,
  bua           numeric,                            -- target area for matching
  bua_min       numeric,                            -- matching range (BUA - tolerance)
  bua_max       numeric,                            -- matching range (BUA + tolerance)
  floor_type    text,                              -- Ground, First, Typical, Fourth...
  image_url     text,                              -- the layout image/floor plan
  rooms         jsonb,                              -- [{name, dimensions}] room breakdown
  sort_order    int default 0,
  created_at    timestamptz default now()
);

create index idx_layouts_project  on unit_layouts(project_id);
create index idx_layouts_category on unit_layouts(category);

-- add FK now that table exists
alter table units
  add constraint fk_units_layout
  foreign key (layout_id) references unit_layouts(id) on delete set null;

-- ============================================================
-- 6) PROJECT MATERIALS  (brochure pages, master plan, gallery)
-- ============================================================
create table project_materials (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references projects(id) on delete cascade,
  type        text not null,                       -- masterplan | brochure_page | gallery | location | amenity
  url         text not null,
  label       text,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

create index idx_materials_project on project_materials(project_id);
create index idx_materials_type    on project_materials(type);

-- ============================================================
-- AUTO-UPDATE updated_at on projects
-- ============================================================
create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_projects_touch
  before update on projects
  for each row execute function touch_updated_at();

-- ============================================================
-- AUTO-RECALC project.start_price from cheapest available unit
-- ============================================================
create or replace function recalc_start_price()
returns trigger as $$
begin
  update projects p
  set start_price = (
    select min(u.unit_price)
    from units u
    where u.project_id = coalesce(new.project_id, old.project_id)
      and u.status = 'available'
      and u.unit_price > 0
  )
  where p.id = coalesce(new.project_id, old.project_id);
  return null;
end;
$$ language plpgsql;

create trigger trg_units_recalc_price
  after insert or update or delete on units
  for each row execute function recalc_start_price();

-- ============================================================
-- ROW LEVEL SECURITY
-- Public site: read-only for everyone (anon).
-- Writes happen through the admin panel using the same anon key
-- for now (simple). Tighten later with Supabase Auth if needed.
-- ============================================================
alter table developers        enable row level security;
alter table projects          enable row level security;
alter table payment_plans     enable row level security;
alter table units             enable row level security;
alter table unit_layouts      enable row level security;
alter table project_materials enable row level security;

-- Public read
drop policy if exists "public_read_developers"        on developers;
drop policy if exists "public_read_projects"          on projects;
drop policy if exists "public_read_payment_plans"     on payment_plans;
drop policy if exists "public_read_units"             on units;
drop policy if exists "public_read_unit_layouts"      on unit_layouts;
drop policy if exists "public_read_project_materials" on project_materials;

create policy "public_read_developers"        on developers        for select using (true);
create policy "public_read_projects"          on projects          for select using (true);
create policy "public_read_payment_plans"     on payment_plans     for select using (true);
create policy "public_read_units"             on units             for select using (true);
create policy "public_read_unit_layouts"      on unit_layouts      for select using (true);
create policy "public_read_project_materials" on project_materials for select using (true);

-- Anon write (admin panel). NOTE: this lets anyone with the anon key write.
-- Acceptable for a private internal tool. Replace with auth-gated policies
-- (e.g. auth.role() = 'authenticated') when you add Supabase Auth.
drop policy if exists "anon_write_developers"        on developers;
drop policy if exists "anon_write_projects"          on projects;
drop policy if exists "anon_write_payment_plans"     on payment_plans;
drop policy if exists "anon_write_units"             on units;
drop policy if exists "anon_write_unit_layouts"      on unit_layouts;
drop policy if exists "anon_write_project_materials" on project_materials;

create policy "anon_write_developers"        on developers        for all using (true) with check (true);
create policy "anon_write_projects"          on projects          for all using (true) with check (true);
create policy "anon_write_payment_plans"     on payment_plans     for all using (true) with check (true);
create policy "anon_write_units"             on units             for all using (true) with check (true);
create policy "anon_write_unit_layouts"      on unit_layouts      for all using (true) with check (true);
create policy "anon_write_project_materials" on project_materials for all using (true) with check (true);

-- ============================================================
-- STORAGE BUCKET for brochures, layouts, master plans, images
-- ============================================================
insert into storage.buckets (id, name, public)
values ('project-assets', 'project-assets', true)
on conflict (id) do nothing;

drop policy if exists "public_read_assets"  on storage.objects;
drop policy if exists "anon_upload_assets"  on storage.objects;
drop policy if exists "anon_update_assets"  on storage.objects;
drop policy if exists "anon_delete_assets"  on storage.objects;

create policy "public_read_assets"
  on storage.objects for select
  using (bucket_id = 'project-assets');

create policy "anon_upload_assets"
  on storage.objects for insert
  with check (bucket_id = 'project-assets');

create policy "anon_update_assets"
  on storage.objects for update
  using (bucket_id = 'project-assets');

create policy "anon_delete_assets"
  on storage.objects for delete
  using (bucket_id = 'project-assets');

-- ============================================================
-- DONE ✅
-- ============================================================

-- ============================================================
-- MIGRATION: filter-support columns (run if upgrading an
-- existing database; harmless on a fresh one since columns
-- are created with IF NOT EXISTS).
-- ============================================================
alter table projects add column if not exists finishing text;     -- fully_finished | semi_finished | not_finished | core_shell
alter table projects add column if not exists dominant_type text; -- most common unit_type, for Types filter

-- Recompute dominant_type whenever units change
create or replace function recalc_dominant_type()
returns trigger as $$
begin
  update projects p
  set dominant_type = (
    select u.unit_type
    from units u
    where u.project_id = coalesce(new.project_id, old.project_id)
      and u.unit_type is not null
    group by u.unit_type
    order by count(*) desc
    limit 1
  )
  where p.id = coalesce(new.project_id, old.project_id);
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_units_dominant_type on units;
create trigger trg_units_dominant_type
  after insert or update or delete on units
  for each row execute function recalc_dominant_type();

-- ============================================================
-- MIGRATION 2: developers-master classification flags
-- (run on existing DB; safe with IF NOT EXISTS)
-- ============================================================
alter table projects add column if not exists is_mixed boolean default false;
alter table projects add column if not exists is_commercial boolean default false;
alter table projects add column if not exists is_residential boolean default true;
alter table projects add column if not exists is_medical boolean default false;
alter table projects add column if not exists is_administrative boolean default false;
alter table projects add column if not exists is_coastal boolean default false;
alter table projects add column if not exists types_raw text;
