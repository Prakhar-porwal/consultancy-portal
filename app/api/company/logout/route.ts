import { NextResponse } from 'next/server'
import { COMPANY_COOKIE } from '@/lib/companyAuth'

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(COMPANY_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/' })
  return res
}
