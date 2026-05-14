import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'

// Update widget config (e.g. pinned repo selection)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { config } = await req.json()
  const supabase = createServerClient()

  // Verify ownership
  const { data: widget } = await supabase
    .from('widgets').select('user_id, config').eq('id', params.id).single()
  if (!widget || widget.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('widgets')
    .update({ config: { ...widget.config, ...config } })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Disconnect widget (clear token + connected_at)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data: widget } = await supabase
    .from('widgets').select('user_id').eq('id', params.id).single()
  if (!widget || widget.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await supabase
    .from('widgets')
    .update({ access_token: null, connected_at: null, config: {} })
    .eq('id', params.id)

  return NextResponse.json({ ok: true })
}
