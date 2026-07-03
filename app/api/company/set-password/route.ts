import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashPassword, getCompanyClientId } from '@/lib/companyAuth'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  const clientId = getCompanyClientId(req)
  if (!clientId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const { password } = await req.json()
  if (!password || String(password).length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
  }

  const { error } = await admin()
    .from('clients')
    .update({ password_hash: hashPassword(String(password)) })
    .eq('id', clientId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
