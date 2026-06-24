-- ============================================================
-- COVO Projects — SAFE MIGRATION (run this in Supabase SQL Editor)
--
-- This ONLY adds the new columns the latest app version needs.
-- It does NOT touch policies, so it will NEVER throw the
-- "policy already exists" error. Safe to run multiple times.
-- ============================================================

-- Filter-support columns
alter table projects add column if not exists finishing text;
alter table projects add column if not exists dominant_type text;

-- Developers-master classification flags
alter table projects add column if not exists is_mixed boolean default false;
alter table projects add column if not exists is_commercial boolean default false;
alter table projects add column if not exists is_residential boolean default true;
alter table projects add column if not exists is_medical boolean default false;
alter table projects add column if not exists is_administrative boolean default false;
alter table projects add column if not exists is_coastal boolean default false;
alter table projects add column if not exists types_raw text;

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
-- DONE ✅  (no policies touched, so no "already exists" errors)
-- ============================================================
