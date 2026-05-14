import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'

// Reorder widgets
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { positions }: { positions: { id: string; position: number }[] } = await req.json()
  const supabase = createServerClient()

  const updates = positions.map(({ id, position }) =>
    supabase
      .from('widgets')
      .update({ position })
      .eq('id', id)
      .eq('user_id', session.user.id)
  )
  await Promise.all(updates)

  return NextResponse.json({ ok: true })
}
