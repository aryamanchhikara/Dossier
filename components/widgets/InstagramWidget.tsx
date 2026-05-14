import WidgetCard from './WidgetCard'
import type { Widget } from '@/types'

interface Props {
  widget?:  Widget
  isOwner:  boolean
}

export default function InstagramWidget({ widget, isOwner }: Props) {
  const connected = !!(widget?.connected_at)

  return (
    <WidgetCard label="Instagram" connected={connected} isOwner={isOwner}>
      <div className="flex flex-col items-center justify-center h-32 gap-3">
        <InstagramMark className="text-muted" />
        {!connected ? (
          isOwner ? (
            <span className="label text-muted">Coming soon</span>
          ) : (
            <p className="text-[11px] text-muted">Not connected</p>
          )
        ) : (
          <p className="text-[11px] text-muted">Instagram connected</p>
        )}
      </div>
    </WidgetCard>
  )
}

function InstagramMark({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
