import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session?.user?.id) {
    const supabase = createServerClient()
    const { data: user } = await supabase
      .from('users')
      .select('username')
      .eq('id', session.user.id)
      .single()
    if (user?.username) redirect(`/${user.username}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full space-y-10">
        <div>
          <p className="label mb-3">Identity platform</p>
          <h1 className="font-serif text-5xl text-primary leading-[1.05] mb-4">
            Your work,<br />your taste,<br />one page.
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            Dossier is a modern alternative to LinkedIn — built for people who
            can't be reduced to a bullet list.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/auth/signin" className="btn-accent block text-center py-3">
            Get started
          </Link>
          <Link href="/auth/signin" className="btn block text-center py-3">
            Sign in
          </Link>
        </div>

        <p className="text-[10px] text-muted">
          Already have a profile?{' '}
          <Link href="/auth/signin" className="text-accent hover:underline">
            Sign in →
          </Link>
        </p>
      </div>
    </main>
  )
}
