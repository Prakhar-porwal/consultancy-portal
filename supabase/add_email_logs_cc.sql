-- ============================================================================
-- Add a `cc` column to email_logs (records who was CC'd on a client email)
-- ----------------------------------------------------------------------------
-- Run in Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- ============================================================================

alter table public.email_logs
  add column if not exists cc text;
