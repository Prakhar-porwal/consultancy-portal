-- ============================================================================
-- FIX: create the missing `hiring_requirements` table (powers the /hire form)
-- ----------------------------------------------------------------------------
-- Run this in Supabase → SQL Editor → New query → Run.
-- Only touches this one table; your other (working) tables are untouched.
-- ============================================================================

create table if not exists public.hiring_requirements (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  company_name         text not null,
  contact_name         text not null,
  contact_email        text not null,
  contact_phone        text not null,
  job_title            text not null,
  num_positions        integer default 1,
  experience_required  text,
  skills_required      text,
  location             text,
  budget_ctc           text,
  timeline             text,
  notes                text,
  status               text not null default 'new'
);

alter table public.hiring_requirements enable row level security;

-- Public visitors submit the /hire form.
-- NOTE: no `to <role>` clause — the policy applies to ALL roles. This matches
-- the other working tables and is required for the new-style `sb_publishable_`
-- key, which does not reliably map to the `anon` role in a `to anon` policy.
drop policy if exists "hiring_anon_insert" on public.hiring_requirements;
create policy "hiring_anon_insert" on public.hiring_requirements
  for insert with check (true);

-- Admin dashboard reads all requirements and updates their status
drop policy if exists "hiring_auth_select" on public.hiring_requirements;
create policy "hiring_auth_select" on public.hiring_requirements
  for select to authenticated using (true);

drop policy if exists "hiring_auth_update" on public.hiring_requirements;
create policy "hiring_auth_update" on public.hiring_requirements
  for update to authenticated using (true) with check (true);
