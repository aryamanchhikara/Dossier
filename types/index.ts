export interface User {
  id: string
  email: string | null
  username: string
  name: string | null
  tagline: string | null
  pull_quote: string | null
  avatar_url: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface TasteItem {
  id: string
  user_id: string
  label: string
  score: number  // 0–100
  position: number
}

export interface CurrentlyItem {
  id: string
  user_id: string
  category: 'reading' | 'building' | 'exploring'
  text: string
}

export interface Widget {
  id: string
  user_id: string
  type: 'github' | 'instagram' | 'spotify'
  position: number
  config: Record<string, unknown>
  connected_at: string | null
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  watchers_count: number
  language: string | null
  updated_at: string
}

export interface GitHubRepoWithLanguages extends GitHubRepo {
  languages: Record<string, number>
}
