export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30)
}

export function generateUsername(email: string): string {
  const base = slugify(email.split('@')[0])
  return base || `user_${Date.now()}`
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours   = Math.floor(diff / 3_600_000)
  const days    = Math.floor(diff / 86_400_000)
  if (days > 30)    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  if (days > 0)     return `${days}d ago`
  if (hours > 0)    return `${hours}h ago`
  if (minutes > 0)  return `${minutes}m ago`
  return 'just now'
}

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript:  '#3178c6',
  JavaScript:  '#f1e05a',
  Python:      '#3572A5',
  Rust:        '#dea584',
  Go:          '#00ADD8',
  CSS:         '#563d7c',
  HTML:        '#e34c26',
  Swift:       '#F05138',
  Kotlin:      '#A97BFF',
  Java:        '#b07219',
  Ruby:        '#701516',
  PHP:         '#4F5D95',
  'C++':       '#f34b7d',
  C:           '#555555',
  Shell:       '#89e051',
  Dockerfile:  '#384d54',
  MDX:         '#083fa1',
  SCSS:        '#c6538c',
}
