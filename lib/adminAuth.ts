import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

/**
 * Validates that the caller is a logged-in admin.
 *
 * The admin signs in through Supabase Auth (email + password). Candidates
 * authenticate via a stateless OTP and have NO Supabase Auth account, so any
 * valid Supabase session token belongs to the admin. We verify the bearer
 * token server-side (getUser checks the JWT signature) before allowing access
 * to service-role / SMTP operations.
 */
export async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return false

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data, error } = await supabase.auth.getUser(token)
  return !error && !!data.user
}
