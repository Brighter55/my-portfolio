import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { ConsoleLevel, ConsoleLine } from '../model'

const levelColor: Record<ConsoleLevel, string> = {
  info: 'text-zinc-400',
  ok: 'text-emerald-400',
  warn: 'text-amber-300',
  err: 'text-red-400',
}

/** Developer console tab — real WebSocket / agent events, timestamped. */
export function ConsolePanel({ lines }: { lines: ConsoleLine[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[#27272e] bg-[#0d0d0e] p-4">
      <p className="label-mono text-zinc-500">Live events</p>
      <div
        ref={scrollRef}
        className="terminal-scroll max-h-80 overflow-y-auto pr-1 font-mono text-[11px] leading-relaxed"
      >
        {lines.length === 0 ? (
          <p className="text-zinc-600">
            [—] No events yet — start a conversation to watch the agent relay.
          </p>
        ) : (
          lines.map((line) => (
            <p key={line.id} className={cn('break-words', levelColor[line.level])}>
              <span className="text-zinc-600">[{line.time}]</span> {line.text}
            </p>
          ))
        )}
      </div>
    </div>
  )
}
