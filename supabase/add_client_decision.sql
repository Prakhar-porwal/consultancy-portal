-- ============================================================================
-- Client decision — let a company mark each shared candidate
-- (Pending / Shortlisted / Selected / Rejected). Visible to admin too.
-- ----------------------------------------------------------------------------
-- Run in Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- ============================================================================

alter table public.candidates
  add column if not exists client_status text not null default 'pending';
