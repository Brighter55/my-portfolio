import { Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { demoCopy, MENU_ITEMS } from '../model'
import type { Phase } from '../model'

interface InfoColumnProps {
  phase: Phase
  injectUserText: (text: string) => void
}

/** Left editorial column: project overview card + the three sample menu items. */
export function InfoColumn({ phase, injectUserText }: InfoColumnProps) {
  // Quick "say this" buttons only work while the agent is listening to the user.
  const canInject = phase === 'listening'

  return (
    <section className="flex w-full flex-col gap-6 lg:w-[440px]">
      {/* Editorial overview card */}
      <div className="rounded-2xl border border-ink/8 bg-paper p-6 shadow-card">
        <p className="label-mono text-amber">WORK · LIVE DEMO</p>
        <h1 className="mt-3 font-display text-2xl font-medium italic leading-tight tracking-[-0.02em] text-ink sm:text-3xl">
          {demoCopy.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {demoCopy.lead}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">
          This demo runs the real production agent (Deepgram Voice Agent — Nova-3
          STT · GPT-4o-mini · Aura TTS over Django Channels) through your
          browser mic. Menu is limited to the three items below; orders are
          taken conversationally and nothing is charged or sent to a POS.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-ink/8 pt-5 font-mono text-[11px] tracking-[-0.01em]">
          {demoCopy.tags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-ink/8 bg-muted px-2 py-1 text-ink/70"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Sample menu card */}
      <div className="rounded-2xl border border-ink/8 bg-paper p-5 shadow-card">
        <span className="label-mono text-ink">Menus</span>
        <p className="mt-2 text-xs text-ink-soft">{demoCopy.menuHint}</p>
        <div className="mt-3 flex flex-col gap-2">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.name}
              type="button"
              disabled={!canInject}
              onClick={() => injectUserText(item.phrase)}
                title={
                  canInject
                    ? 'Injects this phrase as if you said it'
                    : 'Start a conversation, then tap to speak this order'
                }
                className={cn(
                  'group flex items-center justify-between gap-3 rounded-lg border border-ink/8 bg-canvas px-3 py-2.5 text-left text-xs transition',
                  canInject
                    ? 'cursor-pointer text-ink hover:border-ink/20 hover:bg-beige'
                    : 'cursor-default text-ink/40'
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Mic className="size-3.5 shrink-0 text-ink-faint" aria-hidden />
                  <span className="truncate">{item.name}</span>
                  <span aria-hidden className="text-ink-faint">
                    {item.thai}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-ink-soft">
                  {item.price}
                </span>
              </button>
          ))}
        </div>
        {!canInject && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
            {phase === 'idle' || phase === 'ended'
              ? 'Start a conversation, then tap to order by voice'
              : 'The agent is not listening right now'}
          </p>
        )}
      </div>
    </section>
  )
}
