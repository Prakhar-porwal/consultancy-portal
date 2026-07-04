import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPassword, signSession, COMPANY_COOKIE, COMPANY_SESSION_TTL_S } from '@/lib/companyAuth'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'Email and password required.' }, { status: 400 })

  const { data: rows } = await admin()
    .from('clients')
    .select('id, name, password_hash')
    .ilike('email', String(email).trim())
    .limit(1)

  const client = rows?.[0]
  // Same generic error whether the account or password is wrong (no enumeration).
  if (!client || !client.password_hash || !verifyPassword(password, client.password_hash)) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const res = NextResponse.json({ success: true, name: client.name })
  res.cookies.set(COMPANY_COOKIE, signSession(client.id), {
    httpOnly: true, maxAge: COMPANY_SESSION_TTL_S, path: '/', sameSite: 'lax',
  })
  return res
}
