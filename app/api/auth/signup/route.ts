import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email, password, name, username } = await req.json()

  if (!email || !password || !username) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return NextResponse.json({ error: 'Username can only contain lowercase letters, numbers, and underscores' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: existingEmail } = await supabase
    .from('users').select('id').eq('email', email).single()
  if (existingEmail) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  const { data: existingUsername } = await supabase
    .from('users').select('id').eq('username', username).single()
  if (existingUsername) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 12)
  const id = crypto.randomUUID()

  const { error } = await supabase.from('users').insert({
    id, email, name, username, password_hash,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
