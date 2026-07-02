import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/adminAuth'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return unauthorized()
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  const { data, error } = await adminClient().from('clients').insert({ name: name.trim() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin(req))) return unauthorized()
  const { id, name } = await req.json()
  if (!id || !name?.trim()) return NextResponse.json({ error: 'id and name are required.' }, { status: 400 })
  const { data, error } = await adminClient().from('clients').update({ name: name.trim() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) return unauthorized()
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 })
  const supabase = adminClient()
  await supabase.from('candidates').update({ client_id: null }).eq('client_id', id)
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
