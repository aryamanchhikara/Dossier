import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createServerClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto'
import type { GitHubRepo, GitHubRepoWithLanguages } from '@/types'

const GH_API = 'https://api.github.com'

const MOCK_REPOS = [
  { id: 1, name: 'dossier', full_name: 'aryaman/dossier', description: 'Your professional identity, beyond the résumé.', html_url: 'https://github.com', stargazers_count: 142, forks_count: 18, watchers_count: 142, language: 'TypeScript', updated_at: new Date().toISOString(), languages: { TypeScript: 68000, CSS: 12000, JavaScript: 4000 } },
  { id: 2, name: 'identity-platform', full_name: 'aryaman/identity-platform', description: 'Research into digital identity and self-presentation.', html_url: 'https://github.com', stargazers_count: 87, forks_count: 9, watchers_count: 87, language: 'Python', updated_at: new Date(Date.now() - 864e5 * 3).toISOString(), languages: { Python: 42000, Jupyter: 8000 } },
  { id: 3, name: 'taste-api', full_name: 'aryaman/taste-api', description: 'API for cultural taste classification.', html_url: 'https://github.com', stargazers_count: 54, forks_count: 6, watchers_count: 54, language: 'Go', updated_at: new Date(Date.now() - 864e5 * 10).toISOString(), languages: { Go: 31000, Shell: 2000 } },
  { id: 4, name: 'figma-tokens', full_name: 'aryaman/figma-tokens', description: 'Design token pipeline from Figma to code.', html_url: 'https://github.com', stargazers_count: 29, forks_count: 3, watchers_count: 29, language: 'JavaScript', updated_at: new Date(Date.now() - 864e5 * 20).toISOString(), languages: { JavaScript: 18000, CSS: 5000 } },
  { id: 5, name: 'system-maps', full_name: 'aryaman/system-maps', description: 'Visual system thinking toolkit.', html_url: 'https://github.com', stargazers_count: 11, forks_count: 1, watchers_count: 11, language: 'TypeScript', updated_at: new Date(Date.now() - 864e5 * 45).toISOString(), languages: { TypeScript: 9000 } },
]

async function ghFetch(path: string, token: string) {
  const res = await fetch(`${GH_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept:        'application/vnd.github+json',
      'User-Agent':  'Dossier',
    },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${path}`)
  return res.json()
}

// GET /api/github/repos?widget_id=xxx            → top 5 repos
// GET /api/github/repos?widget_id=xxx&repo=o/r   → single repo with languages
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const widgetId = searchParams.get('widget_id')
  const repoName = searchParams.get('repo') // "owner/repo"

  if (!widgetId) return NextResponse.json({ error: 'widget_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data: widget } = await supabase
    .from('widgets')
    .select('user_id, access_token, config')
    .eq('id', widgetId)
    .single()

  if (!widget || widget.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // Local dev: return mock data when access_token is 'mock'
  if (!widget.access_token || widget.access_token === 'mock') {
    if (repoName) {
      const repo = MOCK_REPOS.find(r => r.full_name === repoName) ?? MOCK_REPOS[0]
      return NextResponse.json({ repo })
    }
    return NextResponse.json({ repos: MOCK_REPOS })
  }

  const token    = decrypt(widget.access_token as string)
  const username = (widget.config as Record<string, string>).github_username

  if (repoName) {
    const [repo, languages]: [GitHubRepo, Record<string, number>] = await Promise.all([
      ghFetch(`/repos/${repoName}`, token),
      ghFetch(`/repos/${repoName}/languages`, token),
    ])
    return NextResponse.json({ repo: { ...repo, languages } } satisfies { repo: GitHubRepoWithLanguages })
  }

  const repos: GitHubRepo[] = await ghFetch(
    `/users/${username}/repos?sort=stars&per_page=30&type=public`,
    token
  )
  const top5 = repos
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5)

  return NextResponse.json({ repos: top5 })
}
