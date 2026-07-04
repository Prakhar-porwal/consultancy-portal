import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { signOtp, signSession, COMPANY_COOKIE, COMPANY_OTP_COOKIE, COMPANY_SESSION_TTL_S } from '@/lib/companyAuth'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: 'Code required.' }, { status: 400 })

  const raw = req.cookies.get(COMPANY_OTP_COOKIE)?.value
  if (!raw) return NextResponse.json({ error: 'Session expired. Please request a new code.' }, { status: 400 })

  let stored: { email: string; hmac: string; ts: number; code: string }
  try { stored = JSON.parse(raw) } catch {
    return NextResponse.json({ error: 'Invalid session.' }, { status: 400 })
  }

  if (Date.now() - stored.ts > 10 * 60 * 1000) {
    return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 })
  }
  if (stored.hmac !== signOtp(stored.email, stored.code, stored.ts)) {
    return NextResponse.json({ error: 'Invalid session.' }, { status: 400 })
  }
  if (String(code).trim() !== stored.code) {
    return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 })
  }

  const { data: rows } = await admin()
    .from('clients')
    .select('id, name, password_hash')
    .ilike('email', stored.email)
    .limit(1)

  const client = rows?.[0]
  if (!client) return NextResponse.json({ error: 'Company account not found.' }, { status: 404 })

  const res = NextResponse.json({ success: true, name: client.name, hasPassword: !!client.password_hash })
  res.cookies.set(COMPANY_COOKIE, signSession(client.id), {
    httpOnly: true, maxAge: COMPANY_SESSION_TTL_S, path: '/', sameSite: 'lax',
  })
  res.cookies.set(COMPANY_OTP_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/' })
  return res
}
