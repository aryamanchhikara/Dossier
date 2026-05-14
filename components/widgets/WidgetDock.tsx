'use client'
import { useState } from 'react'
import type { Widget } from '@/types'
import GitHubWidget    from './GitHubWidget'
import InstagramWidget from './InstagramWidget'
import SpotifyWidget   from './SpotifyWidget'

const WIDGET_TYPES: Widget['type'][] = ['github', 'instagram', 'spotify']

interface Props {
  widgets: Widget[]
  isOwner: boolean
  userId:  string
}

export default function WidgetDock({ widgets: initial, isOwner, userId }: Props) {
  const [order, setOrder] = useState(WIDGET_TYPES)
  const [dragging, setDragging] = useState<Widget['type'] | null>(null)

  // Build a map for quick lookup
  const widgetMap = Object.fromEntries(initial.map(w => [w.type, w])) as
    Partial<Record<Widget['type'], Widget>>

  function handleDragStart(type: Widget['type']) {
    setDragging(type)
  }

  function handleDragOver(e: React.DragEvent, type: Widget['type']) {
    e.preventDefault()
    if (!dragging || dragging === type) return
    setOrder(prev => {
      const next = [...prev]
      const from = next.indexOf(dragging)
      const to   = next.indexOf(type)
      next.splice(from, 1)
      next.splice(to, 0, dragging)
      return next
    })
  }

  async function handleDragEnd() {
    setDragging(null)
    const positions = order
      .map((type, i) => ({ id: widgetMap[type]?.id, position: i }))
      .filter(p => p.id) as { id: string; position: number }[]
    if (positions.length) {
      await fetch('/api/widgets', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ positions }),
      })
    }
  }

  return (
    <section className="mt-10">
      <p className="label mb-4">Integrations</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {order.map(type => (
          <div
            key={type}
            draggable={isOwner}
            onDragStart={() => handleDragStart(type)}
            onDragOver={e  => handleDragOver(e, type)}
            onDragEnd={handleDragEnd}
            className={`transition-opacity ${dragging === type ? 'opacity-40' : 'opacity-100'}`}
          >
            {type === 'github' && (
              <GitHubWidget
                widget={widgetMap.github}
                isOwner={isOwner}
                userId={userId}
              />
            )}
            {type === 'instagram' && (
              <InstagramWidget widget={widgetMap.instagram} isOwner={isOwner} />
            )}
            {type === 'spotify' && (
              <SpotifyWidget widget={widgetMap.spotify} isOwner={isOwner} />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
