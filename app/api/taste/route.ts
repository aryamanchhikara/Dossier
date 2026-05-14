import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'

// Replace all taste items for the authenticated user
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items: { label: string; score: number }[] = await req.json()
  if (!Array.isArray(items) || items.length > 5) {
    return NextResponse.json({ error: 'Expected array of up to 5 items' }, { status: 400 })
  }

  const supabase = createServerClient()

  await supabase.from('taste_items').delete().eq('user_id', session.user.id)

  if (items.length > 0) {
    const rows = items.map((item, i) => ({
      user_id:  session.user.id,
      label:    item.label,
      score:    Math.min(100, Math.max(0, item.score)),
      position: i,
    }))
    const { error } = await supabase.from('taste_items').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
