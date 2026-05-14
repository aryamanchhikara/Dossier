interface Props {
  label:       string
  connected:   boolean
  isOwner:     boolean
  onSettings?: () => void
  onDisconnect?: () => void
  children:    React.ReactNode
}

export default function WidgetCard({
  label, connected, isOwner, onSettings, onDisconnect, children,
}: Props) {
  return (
    <div className="card h-full flex flex-col">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {/* Drag handle — only visible to owner */}
          {isOwner && (
            <span className="text-muted cursor-grab active:cursor-grabbing select-none text-xs">
              ⠿
            </span>
          )}
          <span className="label">{label}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection indicator */}
          <span
            className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-muted'}`}
          />

          {isOwner && connected && onSettings && (
            <button
              onClick={onSettings}
              className="text-muted hover:text-primary transition-colors text-sm leading-none"
              title="Configure"
            >
              ⚙
            </button>
          )}

          {isOwner && connected && onDisconnect && (
            <button
              onClick={onDisconnect}
              className="label hover:text-primary transition-colors"
              title="Disconnect"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="flex-1 p-4">
        {children}
      </div>
    </div>
  )
}
