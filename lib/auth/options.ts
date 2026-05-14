import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GithubProvider      from 'next-auth/providers/github'
import GoogleProvider      from 'next-auth/providers/google'
import bcrypt              from 'bcryptjs'
import { createClient }    from '@supabase/supabase-js'
import { createLocalClient } from '@/lib/local-db'
import { generateUsername } from '@/lib/utils'

function getAdminClient() {
  if (process.env.USE_LOCAL_DB === 'true') return createLocalClient()
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAdmin: any = { from: (t: string) => getAdminClient().from(t) }

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id, email, name, avatar_url, password_hash')
          .eq('email', credentials.email)
          .single()

        if (!user?.password_hash) return null

        const valid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name, image: user.avatar_url }
      },
    }),

    GithubProvider({
      clientId:     process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') return true

      // OAuth: upsert user into Supabase on first sign-in
      const email = user.email!
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (!existing) {
        const id = crypto.randomUUID()
        await supabaseAdmin.from('users').insert({
          id,
          email,
          name:       user.name,
          avatar_url: user.image,
          username:   generateUsername(email),
        })
        user.id = id
      } else {
        user.id = existing.id
      }
      return true
    },

    async jwt({ token, user, account }) {
      if (user) {
        // First sign-in: resolve Supabase ID
        if (account?.provider === 'credentials') {
          token.supabaseId = user.id
        } else {
          const { data } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', user.email!)
            .single()
          token.supabaseId = data?.id
        }
      }
      return token
    },

    async session({ session, token }) {
      if (token.supabaseId) {
        session.user.id = token.supabaseId
      }
      return session
    },
  },

  pages: {
    signIn: '/auth/signin',
  },
}
