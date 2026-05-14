import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'

type Category = 'reading' | 'building' | 'exploring'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { category, text }: { category: Category; text: string } = await req.json()
  const valid: Category[] = ['reading', 'building', 'exploring']
  if (!valid.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('currently_items')
    .upsert(
      { user_id: session.user.id, category, text },
      { onConflict: 'user_id,category' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
