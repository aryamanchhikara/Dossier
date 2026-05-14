'use client'
import { useEffect, useState } from 'react'
import WidgetCard        from './WidgetCard'
import WidgetConfigPanel from './WidgetConfigPanel'
import { LANGUAGE_COLORS, timeAgo } from '@/lib/utils'
import type { Widget, GitHubRepoWithLanguages } from '@/types'

interface Props {
  widget?:  Widget
  isOwner:  boolean
  userId:   string
}

export default function GitHubWidget({ widget, isOwner }: Props) {
  const connected = !!(widget?.connected_at)
  const widgetId  = widget?.id
  const pinnedRepo = (widget?.config as Record<string, string>)?.pinned_repo

  const [repo,       setRepo]       = useState<GitHubRepoWithLanguages | null>(null)
  const [topRepos,   setTopRepos]   = useState<{ full_name: string; name: string }[]>([])
  const [loadError,  setLoadError]  = useState('')
  const [configOpen, setConfigOpen] = useState(false)

  // Fetch pinned repo (or first starred repo if none selected)
  useEffect(() => {
    if (!connected || !widgetId) return
    const target = pinnedRepo ? `&repo=${encodeURIComponent(pinnedRepo)}` : ''
    fetch(`/api/github/repos?widget_id=${widgetId}${target}`)
      .then(r => r.json())
      .then(data => {
        if (data.repo) {
          setRepo(data.repo)
        } else if (data.repos?.length) {
          // No pinned repo yet — fetch details for the top one
          const top = data.repos[0].full_name
          return fetch(`/api/github/repos?widget_id=${widgetId}&repo=${encodeURIComponent(top)}`)
            .then(r => r.json())
            .then(d => d.repo && setRepo(d.repo))
        }
      })
      .catch(() => setLoadError('Failed to load GitHub data'))
  }, [connected, widgetId, pinnedRepo])

  // Fetch top repos for config panel
  useEffect(() => {
    if (!configOpen || !widgetId) return
    fetch(`/api/github/repos?widget_id=${widgetId}`)
      .then(r => r.json())
      .then(data => setTopRepos(data.repos ?? []))
  }, [configOpen, widgetId])

  async function disconnect() {
    if (!widgetId) return
    await fetch(`/api/widgets/${widgetId}`, { method: 'DELETE' })
    window.location.reload()
  }

  async function saveConfig(config: Record<string, unknown>) {
    if (!widgetId) return
    await fetch(`/api/widgets/${widgetId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ config }),
    })
    setConfigOpen(false)
    window.location.reload()
  }

  return (
    <>
      <WidgetCard
        label="GitHub"
        connected={connected}
        isOwner={isOwner}
        onSettings={() => setConfigOpen(true)}
        onDisconnect={disconnect}
      >
        {!connected ? (
          /* ─── Disconnected state ─── */
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <GitHubMark className="text-muted" />
            {isOwner ? (
              <a href="/api/github/authorize" className="btn-accent text-[10px] px-4 py-2">
                Connect GitHub
              </a>
            ) : (
              <p className="text-[11px] text-muted">Not connected</p>
            )}
          </div>
        ) : loadError ? (
          <p className="text-[11px] text-muted">{loadError}</p>
        ) : !repo ? (
          <div className="h-32 flex items-center justify-center">
            <span className="text-[11px] text-muted animate-pulse">Loading…</span>
          </div>
        ) : (
          /* ─── Repo display ─── */
          <div className="space-y-3">
            <div>
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:text-accent transition-colors"
              >
                {repo.name}
              </a>
              {repo.description && (
                <p className="text-[11px] text-muted mt-1 leading-relaxed line-clamp-2">
                  {repo.description}
                </p>
              )}
            </div>

            {/* Language bar */}
            {repo.languages && Object.keys(repo.languages).length > 0 && (
              <LanguageBar languages={repo.languages} />
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 pt-1">
              <Stat icon="★" value={repo.stargazers_count} />
              <Stat icon="⑂" value={repo.forks_count} />
              <Stat icon="◉" value={repo.watchers_count} />
              {repo.language && (
                <span className="text-[10px] text-muted ml-auto">{repo.language}</span>
              )}
            </div>

            <p className="text-[9px] text-muted">
              Updated {timeAgo(repo.updated_at)}
            </p>
          </div>
        )}
      </WidgetCard>

      {configOpen && (
        <WidgetConfigPanel
          type="github"
          onClose={() => setConfigOpen(false)}
          onSave={saveConfig}
          extras={{ topRepos, currentRepo: pinnedRepo }}
        />
      )}
    </>
  )
}

function LanguageBar({ languages }: { languages: Record<string, number> }) {
  const total = Object.values(languages).reduce((a, b) => a + b, 0)
  const bars  = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([lang, bytes]) => ({
      lang,
      pct:   (bytes / total) * 100,
      color: LANGUAGE_COLORS[lang] ?? '#555',
    }))

  return (
    <div className="space-y-1.5">
      {/* Bar */}
      <div className="flex h-[3px] rounded-full overflow-hidden gap-[1px]">
        {bars.map(({ lang, pct, color }) => (
          <div key={lang} style={{ width: `${pct}%`, backgroundColor: color }} title={`${lang} ${pct.toFixed(1)}%`} />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {bars.map(({ lang, pct, color }) => (
          <div key={lang} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[9px] text-muted">{lang} {pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ icon, value }: { icon: string; value: number }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-muted">
      <span>{icon}</span>
      <span>{value.toLocaleString()}</span>
    </span>
  )
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}
