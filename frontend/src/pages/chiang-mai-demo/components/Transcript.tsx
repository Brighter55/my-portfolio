import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { demoCopy, QUICK_REPLIES } from '../model'
import type { OrderSummary, Phase, TranscriptLine } from '../model'

interface TranscriptProps {
  lines: TranscriptLine[]
  order: OrderSummary | null
  phase: Phase
  injectUserText: (text: string) => void
}

function AgentAvatar() {
  return (
    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-zinc-400">
      <div className="h-2 w-2 rounded-full border border-zinc-400" />
    </div>
  )
}

function OrderRecap({ order }: { order: OrderSummary }) {
  const items = order.items ?? []
  return (
    <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 px-3.5 py-3">
      <p className="label-mono text-emerald-400">Order confirmed · demo</p>
      {order.customer_name ? (
        <p className="mt-1 font-mono text-[11px] text-zinc-400">
          For: {order.customer_name}
        </p>
      ) : null}
      <ul className="mt-1.5 space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3 font-mono text-[11px] text-zinc-300">
            <span>
              {item.quantity ?? 1}× {item.name}
            </span>
            {typeof item.price === 'number' && (
              <span className="text-zinc-400">
                ${item.price.toFixed(2)}
                {item.quantity && item.quantity > 1 ? ' ea' : ''}
              </span>
            )}
          </li>
        ))}
      </ul>
      {typeof order.total === 'number' && (
        <p className="mt-2 border-t border-emerald-400/20 pt-1.5 text-right font-mono text-[12px] text-emerald-300">
          Total ${order.total.toFixed(2)}
        </p>
      )}
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
        {order.note ?? 'Nothing was charged or sent — conversation only.'}
      </p>
    </div>
  )
}

/** Live transcript bubbles + "Customer Speech Injection" chips. */
export function Transcript({
  lines,
  order,
  phase,
  injectUserText,
}: TranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const canInject = phase === 'listening'

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, order])

  const showCard = lines.length > 0 || order !== null

  return (
    <div className="w-full transition-all duration-500">
      <div className="flex flex-col gap-3 rounded-2xl border border-[#27272e] bg-[#1a1a1e] p-4">
        {order !== null && <OrderRecap order={order} />}

        {!showCard ? (
          <p className="py-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
            Start a conversation to see the live transcript…
          </p>
        ) : (
          <div
            ref={scrollRef}
            className="terminal-scroll flex max-h-64 flex-col gap-3 overflow-y-auto pr-1"
          >
            {lines.map((line) =>
              line.role === 'agent' ? (
                <div key={line.id} className="flex items-start gap-3">
                  <AgentAvatar />
                  <div className="flex-1 rounded-xl border border-[#2e2e38] bg-[#222229] px-3.5 py-3 text-xs leading-relaxed text-zinc-200 sm:text-sm">
                    {line.text}
                  </div>
                </div>
              ) : (
                <div key={line.id} className="ml-9 flex items-start justify-end gap-3">
                  <div className="max-w-[85%] rounded-xl border border-[#d946ef]/25 bg-[#d946ef]/10 px-3.5 py-3 text-xs leading-relaxed text-zinc-100 sm:text-sm">
                    {line.text}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {phase !== 'idle' && phase !== 'ended' && phase !== 'error' && (
          <div className="flex flex-col gap-1.5 border-t border-[#27272e] pt-3">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" aria-hidden />
              {demoCopy.injectionLabel}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  disabled={!canInject}
                  onClick={() => injectUserText(reply)}
                  className={cn(
                    'rounded-md border border-zinc-700/60 px-2.5 py-1.5 text-left text-[11px] transition',
                    canInject
                      ? 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                      : 'cursor-default bg-zinc-800/40 text-zinc-600'
                  )}
                >
                  “{reply}”
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
