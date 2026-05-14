import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=github_callback`)
  }

  // Decode state
  let widgetId: string
  let userId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    widgetId = decoded.widgetId
    userId   = decoded.userId
  } catch {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=invalid_state`)
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method:  'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri:  `${process.env.NEXTAUTH_URL}/api/github/callback`,
    }),
  })
  const tokenData = await tokenRes.json()
  const accessToken: string = tokenData.access_token

  if (!accessToken) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=github_token`)
  }

  // Fetch GitHub user info
  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'Dossier' },
  })
  const ghUser = await userRes.json()

  const supabase = createServerClient()

  // Update widget with encrypted token + github username
  //Auth is faling on this step and not working coorectly
  await supabase
    .from('widgets')
    .update({
      access_token: encrypt(accessToken),
      connected_at: new Date().toISOString(),
      config: { github_username: ghUser.login },
    })
    .eq('id', widgetId)
    .eq('user_id', userId)

  // Redirect back to the user's profile
  const { data: user } = await supabase
    .from('users').select('username').eq('id', userId).single()

  const dest = user?.username
    ? `${process.env.NEXTAUTH_URL}/${user.username}`
    : `${process.env.NEXTAUTH_URL}/dashboard`

  return NextResponse.redirect(dest)
}
