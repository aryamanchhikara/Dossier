import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import HeroSection    from '@/components/profile/HeroSection'
import PullQuote      from '@/components/profile/PullQuote'
import TasteSidebar   from '@/components/profile/TasteSidebar'
import CurrentlyBlock from '@/components/profile/CurrentlyBlock'
import WidgetDock     from '@/components/widgets/WidgetDock'

interface Props { params: { username: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createServerClient()
  const { data: user } = await supabase
    .from('users').select('name, tagline').eq('username', params.username).single()
  return {
    title:       user?.name ? `${user.name} — Dossier` : 'Dossier',
    description: user?.tagline ?? undefined,
  }
}

export default async function ProfilePage({ params }: Props) {
  const supabase = createServerClient()
  const session  = await getServerSession(authOptions)

  const { data: user } = await supabase
    .from('users')
    .select('id, email, username, name, tagline, pull_quote, avatar_url, tags, created_at, updated_at')
    .eq('username', params.username)
    .single()

  if (!user) notFound()

  const [{ data: tasteItems }, { data: currentlyItems }, { data: widgets }] =
    await Promise.all([
      supabase.from('taste_items').select('*').eq('user_id', user.id).order('position'),
      supabase.from('currently_items').select('*').eq('user_id', user.id),
      supabase.from('widgets').select('id, user_id, type, position, config, connected_at')
               .eq('user_id', user.id).order('position'),
    ])

  const isOwner = session?.user?.id === user.id

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-6 pb-20">
      {/* Nav bar */}
      <nav className="flex items-center justify-between py-5 mb-2 border-b border-border">
        <span className="font-serif text-accent text-sm">Dossier.</span>
        {isOwner && (
          <a href="/dashboard" className="label hover:text-primary transition-colors">
            Dashboard →
          </a>
        )}
      </nav>

      {/* Hero */}
      <HeroSection user={user} isOwner={isOwner} />

      {/* Pull quote */}
      <PullQuote quote={user.pull_quote} isOwner={isOwner} userId={user.id} />

      {/* Currently + Taste */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        <CurrentlyBlock
          items={currentlyItems ?? []}
          isOwner={isOwner}
          userId={user.id}
        />
        <TasteSidebar
          items={tasteItems ?? []}
          isOwner={isOwner}
          userId={user.id}
        />
      </div>

      {/* Widget dock */}
      <WidgetDock
        widgets={widgets ?? []}
        isOwner={isOwner}
        userId={user.id}
      />
    </main>
  )
}
