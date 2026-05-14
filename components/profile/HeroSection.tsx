'use client'
import { useState } from 'react'
import Image from 'next/image'
import type { User } from '@/types'

interface Props {
  user: User
  isOwner: boolean
}

export default function HeroSection({ user, isOwner }: Props) {
  const [name,    setName]    = useState(user.name    ?? '')
  const [tagline, setTagline] = useState(user.tagline ?? '')
  const [tags,    setTags]    = useState<string[]>(user.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [saving,  setSaving]  = useState(false)

  async function save(patch: Record<string, unknown>) {
    setSaving(true)
    await fetch('/api/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(patch),
    })
    setSaving(false)
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' && e.key !== ',') return
    e.preventDefault()
    const val = tagInput.trim()
    if (val && !tags.includes(val) && tags.length < 6) {
      const next = [...tags, val]
      setTags(next)
      setTagInput('')
      save({ tags: next })
    }
  }

  function removeTag(t: string) {
    const next = tags.filter(x => x !== t)
    setTags(next)
    save({ tags: next })
  }

  return (
    <section className="pt-10 pb-8 border-b border-border">
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.name ?? 'Avatar'}
              width={72} height={72}
              className="rounded-sm border border-border"
            />
          ) : (
            <div className="w-[72px] h-[72px] bg-surface border border-border rounded-sm
                            flex items-center justify-center text-muted text-xl font-serif">
              {(user.name ?? user.username)[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Name + tagline */}
        <div className="flex-1 min-w-0">
          {isOwner ? (
            <input
              className="font-serif text-4xl text-primary bg-transparent border-b border-transparent
                         hover:border-border focus:border-border focus:outline-none w-full transition-colors"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => save({ name })}
              placeholder="Your name"
            />
          ) : (
            <h1 className="font-serif text-4xl text-primary">{user.name ?? user.username}</h1>
          )}

          {isOwner ? (
            <input
              className="mt-2 text-sm text-muted bg-transparent border-b border-transparent
                         hover:border-border focus:border-border focus:outline-none w-full transition-colors"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              onBlur={() => save({ tagline })}
              placeholder="One-line tagline…"
            />
          ) : (
            user.tagline && (
              <p className="mt-2 text-sm text-muted">{user.tagline}</p>
            )
          )}

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            {tags.map(t => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border
                           text-[10px] uppercase tracking-[0.1em] text-muted"
              >
                {t}
                {isOwner && (
                  <button onClick={() => removeTag(t)} className="hover:text-primary leading-none">
                    ×
                  </button>
                )}
              </span>
            ))}
            {isOwner && tags.length < 6 && (
              <input
                className="text-[10px] uppercase tracking-[0.1em] bg-transparent
                           text-muted placeholder:text-muted/50 focus:outline-none w-24"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="+ add tag"
              />
            )}
          </div>
        </div>

        {saving && (
          <span className="text-[10px] text-muted self-start mt-1">saving…</span>
        )}
      </div>
    </section>
  )
}
