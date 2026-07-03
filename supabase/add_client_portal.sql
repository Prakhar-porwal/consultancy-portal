-- ============================================================================
-- Client (company) portal — give each client a login to view their candidates
-- ----------------------------------------------------------------------------
-- Run in Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- ============================================================================

-- Login email (companies authenticate with this) + optional password.
alter table public.clients
  add column if not exists email          text,
  add column if not exists password_hash  text;

-- One client per login email.
create unique index if not exists clients_email_key
  on public.clients (lower(email))
  where email is not null;
