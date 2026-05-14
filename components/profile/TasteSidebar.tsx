'use client'
import { useState } from 'react'
import type { TasteItem } from '@/types'

interface EditRow { label: string; score: number }
interface Props {
  items:   TasteItem[]
  isOwner: boolean
  userId:  string
}

export default function TasteSidebar({ items, isOwner }: Props) {
  const [rows, setRows]     = useState<EditRow[]>(
    items.length
      ? items.map(i => ({ label: i.label, score: i.score }))
      : [{ label: '', score: 80 }]
  )
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)

  async function saveAll() {
    setSaving(true)
    await fetch('/api/taste', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(rows.filter(r => r.label)),
    })
    setSaving(false)
    setEditing(false)
  }

  function updateRow(i: number, patch: Partial<EditRow>) {
    setRows(r => r.map((row, idx) => idx === i ? { ...row, ...patch } : row))
  }

  const displayRows = isOwner ? rows : items.map(i => ({ label: i.label, score: i.score }))
  if (!isOwner && displayRows.length === 0) return null

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="label">Taste</p>
        {isOwner && !editing && (
          <button onClick={() => setEditing(true)} className="label hover:text-primary transition-colors">
            Edit
          </button>
        )}
      </div>

      <div className="space-y-4">
        {displayRows.map((row, i) => (
          <div key={i}>
            {editing ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  className="flex-1 bg-transparent text-[11px] text-muted border-b border-border
                             focus:outline-none focus:border-[#444] pb-0.5"
                  value={row.label}
                  onChange={e => updateRow(i, { label: e.target.value })}
                  placeholder="Category"
                />
                <input
                  type="number" min={0} max={100}
                  className="w-12 bg-transparent text-[11px] text-muted text-right border-b border-border
                             focus:outline-none"
                  value={row.score}
                  onChange={e => updateRow(i, { score: Number(e.target.value) })}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-[0.1em] text-muted">{row.label}</span>
                <span className="text-[10px] text-muted tabular-nums">{row.score}</span>
              </div>
            )}
            {/* Bar */}
            <div className="h-[2px] bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${row.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {isOwner && editing && (
        <div className="mt-5 space-y-2">
          {rows.length < 5 && (
            <button
              onClick={() => setRows(r => [...r, { label: '', score: 70 }])}
              className="label hover:text-primary transition-colors"
            >
              + Add
            </button>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={saveAll} disabled={saving} className="btn-accent text-[10px] px-3 py-1.5">
              {saving ? '…' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} className="btn text-[10px] px-3 py-1.5">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
