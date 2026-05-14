'use client'
import { useState } from 'react'

interface Props {
  quote:   string | null
  isOwner: boolean
  userId:  string
}

export default function PullQuote({ quote, isOwner }: Props) {
  const [text, setText] = useState(quote ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await fetch('/api/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pull_quote: text }),
    })
    setSaving(false)
  }

  if (!isOwner && !text) return null

  return (
    <div className="mt-8 border-l-2 border-accent pl-5 py-1">
      {isOwner ? (
        <textarea
          className="w-full bg-transparent text-lg font-serif italic text-primary/80
                     resize-none focus:outline-none placeholder:text-muted"
          rows={2}
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={save}
          placeholder="A sentence that defines your philosophy…"
        />
      ) : (
        <blockquote className="text-lg font-serif italic text-primary/80">
          {text}
        </blockquote>
      )}
      {saving && <p className="text-[10px] text-muted mt-1">saving…</p>}
    </div>
  )
}
