import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { flowType: 'implicit', detectSessionInUrl: true } }
    )
  }
  return _supabase
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export type Candidate = {
  id: string
  created_at: string
  full_name: string
  email: string
  phone: string
  alt_phone: string | null
  linkedin_url: string | null
  ready_to_relocate: boolean
  education_type: string | null
  education_institution: string | null
  current_company: string
  current_ctc: number
  expected_ctc: number
  notice_period: string
  is_immediate_joiner: boolean
  total_experience: string
  skills: string
  current_location: string
  preferred_location: string
  resume_url: string | null
  client_id: string | null
  notes: string | null
  status: 'new' | 'screening' | 'shortlisted' | 'rejected' | 'placed'
}

export type Client = {
  id: string
  name: string
  created_at: string
}

export type Job = {
  id: string
  title: string
  description: string
  location: string
  experience_required: string | null
  jd_url: string | null
  status: 'active' | 'closed'
  created_at: string
}
