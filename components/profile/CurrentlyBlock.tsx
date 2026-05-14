'use client'
import { useState } from 'react'
import type { CurrentlyItem } from '@/types'

type Category = 'reading' | 'building' | 'exploring'
const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: 'reading',   label: 'Reading',   icon: '◎' },
  { key: 'building',  label: 'Building',  icon: '◈' },
  { key: 'exploring', label: 'Exploring', icon: '◇' },
]

interface Props {
  items:   CurrentlyItem[]
  isOwner: boolean
  userId:  string
}

export default function CurrentlyBlock({ items, isOwner }: Props) {
  const init = Object.fromEntries(
    CATEGORIES.map(({ key }) => [key, items.find(i => i.category === key)?.text ?? ''])
  ) as Record<Category, string>

  const [values, setValues]   = useState(init)
  const [saving, setSaving]   = useState<Category | null>(null)

  async function save(category: Category, text: string) {
    setSaving(category)
    await fetch('/api/currently', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ category, text }),
    })
    setSaving(null)
  }

  const anyValue = CATEGORIES.some(({ key }) => values[key])
  if (!isOwner && !anyValue) return null

  return (
    <div className="card p-5">
      <p className="label mb-4">Currently</p>
      <div className="space-y-4">
        {CATEGORIES.map(({ key, label, icon }) => (
          <div key={key} className="flex items-start gap-3">
            <span className="text-accent mt-0.5 text-sm select-none">{icon}</span>
            <div className="flex-1">
              <p className="label mb-1">{label}</p>
              {isOwner ? (
                <input
                  className="w-full bg-transparent text-sm text-muted focus:text-primary
                             border-b border-transparent hover:border-border focus:border-border
                             focus:outline-none transition-colors pb-0.5"
                  value={values[key]}
                  onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                  onBlur={() => save(key, values[key])}
                  placeholder={`What are you ${key} right now?`}
                />
              ) : (
                <p className="text-sm text-muted">{values[key] || '—'}</p>
              )}
              {saving === key && (
                <p className="text-[9px] text-muted mt-0.5">saving…</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
