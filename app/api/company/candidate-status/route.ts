import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCompanyClientId } from '@/lib/companyAuth'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const ALLOWED = ['pending', 'shortlisted', 'selected', 'rejected']

// A company sets its decision on a candidate. It may only touch candidates
// that are assigned to it (client_id === session client id).
export async function POST(req: NextRequest) {
  const clientId = getCompanyClientId(req)
  if (!clientId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const { candidateId, status } = await req.json()
  if (!candidateId || !ALLOWED.includes(status)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { data, error } = await admin()
    .from('candidates')
    .update({ client_status: status })
    .eq('id', candidateId)
    .eq('client_id', clientId)          // ← ownership guard
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.length) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })
  return NextResponse.json({ success: true })
}
