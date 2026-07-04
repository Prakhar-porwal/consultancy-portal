import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySession, COMPANY_COOKIE } from '@/lib/companyAuth'
import PortalClient from './PortalClient'

export const dynamic = 'force-dynamic'

// Server-side gate: validate the signed company session cookie BEFORE any
// portal HTML is sent. An unauthenticated (or forged/expired) visitor is
// redirected to the login page and never receives the portal page at all.
export default async function CompanyPortalPage() {
  const token = (await cookies()).get(COMPANY_COOKIE)?.value
  if (!verifySession(token)) redirect('/company/login')
  return <PortalClient />
}
