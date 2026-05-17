import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function sign(email: string, code: string, ts: number) {
  const secret = process.env.SMTP_PASS ?? 'rsd-otp-secret'
  return crypto.createHmac('sha256', secret).update(`${email}:${code}:${ts}`).digest('hex')
}

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: 'Code required.' }, { status: 400 })

  const raw = req.cookies.get('rsd_otp')?.value
  if (!raw) return NextResponse.json({ error: 'Session expired. Please request a new code.' }, { status: 400 })

  let stored: { email: string; hmac: string; ts: number; code: string }
  try { stored = JSON.parse(raw) } catch {
    return NextResponse.json({ error: 'Invalid session.' }, { status: 400 })
  }

  // Check expiry (10 minutes)
  if (Date.now() - stored.ts > 10 * 60 * 1000) {
    return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 })
  }

  // Verify HMAC
  const expectedHmac = sign(stored.email, stored.code, stored.ts)
  if (stored.hmac !== expectedHmac) {
    return NextResponse.json({ error: 'Invalid session.' }, { status: 400 })
  }

  // Verify code
  if (code.trim() !== stored.code) {
    return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 })
  }

  // Fetch candidate name (service role key bypasses RLS)
  const { data: rows } = await supabaseAdmin
    .from('candidates')
    .select('full_name')
    .ilike('email', stored.email)
    .limit(1)

  const res = NextResponse.json({ success: true, email: stored.email, name: rows?.[0]?.full_name ?? '' })

  // Clear OTP cookie
  res.cookies.set('rsd_otp', '', { httpOnly: true, maxAge: 0, path: '/' })
  return res
}
