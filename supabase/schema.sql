-- ============================================================================
-- matchwork — complete database setup
-- ----------------------------------------------------------------------------
-- Safe to run multiple times. Paste this whole file into the Supabase
-- SQL editor (Dashboard → SQL Editor → New query) and click "Run".
--
-- It creates every table, storage bucket, and Row-Level-Security policy the
-- app expects. Existing tables are left untouched (CREATE ... IF NOT EXISTS).
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────
-- 1. TABLES
-- ─────────────────────────────────────────────────────────────────────────

-- Clients / companies (created first — candidates references it).
-- email + password_hash power the client portal login (see add_client_portal.sql).
create table if not exists public.clients (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text,
  password_hash  text,
  created_at     timestamptz not null default now()
);

-- Candidates (the /apply form)
create table if not exists public.candidates (
  id                     uuid primary key default gen_random_uuid(),
  created_at             timestamptz not null default now(),
  full_name              text not null,
  email                  text not null,
  phone                  text not null,
  alt_phone              text,
  linkedin_url           text,
  ready_to_relocate      boolean,
  education_type         text,
  education_institution  text,
  current_company        text,
  current_ctc            numeric,
  expected_ctc           numeric,
  notice_period          text,
  is_immediate_joiner    boolean default false,
  total_experience       text,
  skills                 text,
  current_location       text,
  preferred_location     text,
  resume_url             text,
  client_id              uuid references public.clients(id) on delete set null,
  notes                  text,
  status                 text not null default 'new'
);

-- Jobs (admin posts these; candidates browse them)
create table if not exists public.jobs (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  description           text not null,
  location              text not null,
  experience_required   text,
  jd_url                text,
  status                text not null default 'active',
  created_at            timestamptz not null default now()
);

-- Job applications (candidate clicks "Apply Now")
create table if not exists public.job_applications (
  id               uuid primary key default gen_random_uuid(),
  job_id           uuid not null references public.jobs(id) on delete cascade,
  candidate_email  text not null,
  created_at       timestamptz not null default now(),
  unique (job_id, candidate_email)   -- prevents applying twice to same job
);

-- Hiring requirements (the /hire form for companies)
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

-- Email logs (audit trail of CVs sent to clients)
create table if not exists public.email_logs (
  id          uuid primary key default gen_random_uuid(),
  sent_at     timestamptz not null default now(),
  to_email    text,
  to_name     text,
  cc          text,
  subject     text,
  candidates  jsonb
);


-- ─────────────────────────────────────────────────────────────────────────
-- 2. ENABLE ROW-LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────
alter table public.clients             enable row level security;
alter table public.candidates          enable row level security;
alter table public.jobs                enable row level security;
alter table public.job_applications    enable row level security;
alter table public.hiring_requirements enable row level security;
alter table public.email_logs          enable row level security;


-- ─────────────────────────────────────────────────────────────────────────
-- 3. POLICIES
--    anon          = public visitors (apply form, hire form, jobs page)
--    authenticated = logged-in admin (dashboard)
--    service_role  = server API routes — always bypasses RLS, no policy needed
-- ─────────────────────────────────────────────────────────────────────────

-- CANDIDATES: public can submit; admin can read + update
-- NOTE: public INSERT policies below omit the `to <role>` clause so they apply
-- to ALL roles. Required for the new-style `sb_publishable_` API key, which
-- does not reliably match a `to anon` policy.
drop policy if exists "candidates_anon_insert" on public.candidates;
create policy "candidates_anon_insert" on public.candidates
  for insert with check (true);

drop policy if exists "candidates_auth_select" on public.candidates;
create policy "candidates_auth_select" on public.candidates
  for select to authenticated using (true);

drop policy if exists "candidates_auth_update" on public.candidates;
create policy "candidates_auth_update" on public.candidates
  for update to authenticated using (true) with check (true);

-- CLIENTS: admin can read (writes go through service-role API)
drop policy if exists "clients_auth_select" on public.clients;
create policy "clients_auth_select" on public.clients
  for select to authenticated using (true);

-- JOBS: anyone can read (candidate jobs page); admin manages fully
drop policy if exists "jobs_public_select" on public.jobs;
create policy "jobs_public_select" on public.jobs
  for select using (true);

drop policy if exists "jobs_auth_all" on public.jobs;
create policy "jobs_auth_all" on public.jobs
  for all to authenticated using (true) with check (true);

-- JOB APPLICATIONS: candidate can read + create; admin can read
drop policy if exists "job_applications_public_select" on public.job_applications;
create policy "job_applications_public_select" on public.job_applications
  for select using (true);

drop policy if exists "job_applications_anon_insert" on public.job_applications;
create policy "job_applications_anon_insert" on public.job_applications
  for insert with check (true);

-- HIRING REQUIREMENTS: company can submit; admin reads + updates status
drop policy if exists "hiring_anon_insert" on public.hiring_requirements;
create policy "hiring_anon_insert" on public.hiring_requirements
  for insert with check (true);

drop policy if exists "hiring_auth_select" on public.hiring_requirements;
create policy "hiring_auth_select" on public.hiring_requirements
  for select to authenticated using (true);

drop policy if exists "hiring_auth_update" on public.hiring_requirements;
create policy "hiring_auth_update" on public.hiring_requirements
  for update to authenticated using (true) with check (true);

-- EMAIL LOGS: touched only by service-role API routes → no policy required.


-- ─────────────────────────────────────────────────────────────────────────
-- 4. STORAGE BUCKET  (resumes + job-description files)
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do update set public = true;

-- Anyone can upload a resume / JD; files are publicly readable via getPublicUrl
drop policy if exists "resumes_upload" on storage.objects;
create policy "resumes_upload" on storage.objects
  for insert with check (bucket_id = 'resumes');

drop policy if exists "resumes_read" on storage.objects;
create policy "resumes_read" on storage.objects
  for select using (bucket_id = 'resumes');

-- ============================================================================
-- Done. All forms (apply, hire, candidate jobs, admin dashboard) are now wired.
-- ============================================================================
