import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCompanyClientId } from '@/lib/companyAuth'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Returns ONLY the candidates the admin has assigned to this company
// (candidates.client_id === session client id). Full details incl. contact.
export async function GET(req: NextRequest) {
  const clientId = getCompanyClientId(req)
  if (!clientId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const { data, error } = await admin()
    .from('candidates')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
