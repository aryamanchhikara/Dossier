import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return redirect('/auth/signin')

  const supabase = createServerClient()

  // Get or create the GitHub widget row so we have an ID for the state param
  const { data: widget, error } = await supabase
    .from('widgets')
    .upsert(
      { user_id: session.user.id, type: 'github', position: 0 },
      { onConflict: 'user_id,type', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (error || !widget) {
    return NextResponse.json({ error: 'Failed to init widget' }, { status: 500 })
  }

  const state = Buffer.from(
    JSON.stringify({ widgetId: widget.id, userId: session.user.id })
  ).toString('base64url')

  const params = new URLSearchParams({
    client_id:    process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/github/callback`,
    scope:        'read:user public_repo',
    state,
  })

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params}`
  )
}
