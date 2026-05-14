import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const supabase = createServerClient()
  const { data: user } = await supabase
    .from('users')
    .select('username, name')
    .eq('id', session.user.id)
    .single()

  if (!user) redirect('/auth/signin')

  return (
    <main className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
      <div className="mb-10">
        <p className="label mb-2">Dashboard</p>
        <h1 className="font-serif text-3xl text-primary">
          {user.name || user.username}
        </h1>
      </div>

      <div className="space-y-3">
        <Link
          href={`/${user.username}`}
          className="card flex items-center justify-between px-5 py-4 hover:border-[#333] transition-colors"
        >
          <div>
            <p className="text-sm text-primary">Your profile</p>
            <p className="text-[11px] text-muted mt-0.5">dossier.app/{user.username}</p>
          </div>
          <span className="text-muted text-lg">→</span>
        </Link>

        <div className="card px-5 py-4 opacity-50 cursor-not-allowed select-none">
          <p className="text-sm text-primary">Analytics</p>
          <p className="text-[11px] text-muted mt-0.5">Coming soon</p>
        </div>
      </div>
    </main>
  )
}
