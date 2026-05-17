-- Run this in your Supabase SQL editor

-- Clients table (your company's clients)
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Seed some clients
insert into clients (name) values
  ('Client A'),
  ('Client B'),
  ('Client C');

-- Candidates table
create table candidates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  full_name text not null,
  email text not null,
  phone text not null,
  current_company text,
  current_ctc numeric(10,2) not null,
  expected_ctc numeric(10,2) not null,
  notice_period text not null,
  is_immediate_joiner boolean default false,
  total_experience text not null,
  skills text not null,
  current_location text not null,
  preferred_location text,
  resume_url text,
  client_id uuid references clients(id),
  notes text,
  status text default 'new' check (status in ('new','screening','shortlisted','rejected','placed'))
);

-- Allow public to insert candidates (form submissions)
alter table candidates enable row level security;
create policy "Anyone can submit" on candidates for insert with check (true);

-- Only authenticated users can read
create policy "Auth users can read" on candidates for select using (auth.role() = 'authenticated');
create policy "Auth users can update" on candidates for update using (auth.role() = 'authenticated');

-- Clients readable by authenticated users only
alter table clients enable row level security;
create policy "Auth users can read clients" on clients for select using (auth.role() = 'authenticated');

-- ── Jobs table ──────────────────────────────────────────────────────────────
create table jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  location text not null,
  experience_required text,
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz default now()
);

alter table jobs enable row level security;

-- Authenticated users (candidates + admin) can read active jobs
create policy "Auth users read active jobs" on jobs
  for select using (auth.role() = 'authenticated' and status = 'active');

-- Admin (any authenticated user) can read ALL jobs, insert, update, delete
-- Note: only the admin knows the login password, so this is safe for MVP
create policy "Auth users manage jobs" on jobs
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Public can read active jobs (candidates use localStorage session, not Supabase Auth)
drop policy if exists "Auth users read active jobs" on jobs;
create policy "Public read active jobs" on jobs
  for select using (status = 'active');

-- Authenticated users (admin) can read all jobs including closed
create policy "Auth read all jobs" on jobs
  for select using (auth.role() = 'authenticated');
