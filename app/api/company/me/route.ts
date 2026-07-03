import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCompanyClientId } from '@/lib/companyAuth'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET(req: NextRequest) {
  const clientId = getCompanyClientId(req)
  if (!clientId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const { data: rows } = await admin()
    .from('clients')
    .select('id, name, email, password_hash')
    .eq('id', clientId)
    .limit(1)

  const client = rows?.[0]
  if (!client) return NextResponse.json({ error: 'Account not found.' }, { status: 401 })

  return NextResponse.json({
    id: client.id,
    name: client.name,
    email: client.email,
    hasPassword: !!client.password_hash,
  })
}
