'use client'
import { useEffect, useRef, useState } from 'react'

interface GitHubExtras {
  topRepos:    { full_name: string; name: string }[]
  currentRepo: string | undefined
}

interface Props {
  type:    'github' | 'instagram' | 'spotify'
  onClose: () => void
  onSave:  (config: Record<string, unknown>) => void
  extras?: GitHubExtras
}

export default function WidgetConfigPanel({ type, onClose, onSave, extras }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/60 flex justify-end"
    >
      <div className="w-full max-w-sm bg-[#0e0e0e] border-l border-border h-full flex flex-col
                      animate-[slideIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="label">{type} — configure</p>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 px-5 py-6">
          {type === 'github' && extras && (
            <GitHubConfig extras={extras} onSave={onSave} />
          )}
          {(type === 'instagram' || type === 'spotify') && (
            <div className="flex items-center justify-center h-32">
              <p className="text-[11px] text-muted">Configuration coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GitHubConfig({
  extras: { topRepos, currentRepo },
  onSave,
}: {
  extras: GitHubExtras
  onSave: (config: Record<string, unknown>) => void
}) {
  const [selected, setSelected] = useState(currentRepo ?? '')

  return (
    <div className="space-y-5">
      <div>
        <label className="label block mb-2">Pinned repository</label>
        <p className="text-[11px] text-muted mb-3">
          Choose which repo to display on your profile.
        </p>
        <select
          className="input text-sm"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">— Select a repo —</option>
          {topRepos.map(r => (
            <option key={r.full_name} value={r.full_name}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={() => selected && onSave({ pinned_repo: selected })}
        disabled={!selected}
        className="btn-accent w-full py-2.5 text-[11px] disabled:opacity-40"
      >
        Save
      </button>
    </div>
  )
}
