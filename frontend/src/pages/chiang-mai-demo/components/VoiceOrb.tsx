import { cn } from '@/lib/utils'
import { STATUS_LABEL, type Phase } from '../model'

const statusColor: Record<Phase, string> = {
  idle: 'text-zinc-500',
  connecting: 'text-zinc-300',
  listening: 'text-pink-400',
  speaking: 'text-cyan-300',
  processing: 'text-purple-300',
  ended: 'text-zinc-400',
  error: 'text-red-400',
}

interface VoiceOrbProps {
  phase: Phase
  running: boolean
}

const BAR_STYLES = [
  { h: 'h-2', dur: '0.6s', color: 'bg-pink-400' },
  { h: 'h-4', dur: '0.4s', color: 'bg-purple-400' },
  { h: 'h-5', dur: '0.7s', color: 'bg-cyan-400' },
  { h: 'h-3', dur: '0.5s', color: 'bg-emerald-400' },
]

/** The animated multi-ring voice orb (ported from the Stitch design). */
export function VoiceOrb({ phase, running }: VoiceOrbProps) {
  const showBars = running && phase !== 'processing'
  return (
    <div
      className={cn(
        'relative flex h-44 w-44 select-none items-center justify-center sm:h-56 sm:w-56',
        running && 'is-active'
      )}
      aria-live="polite"
    >
      <div className="orb-ring orb-ring-1" />
      <div className="orb-ring orb-ring-2" />
      <div className="orb-ring orb-ring-3" />

      {/* Inner dark sphere */}
      <div className="z-10 flex h-32 w-32 flex-col items-center justify-center rounded-full border border-[#27272a] bg-[#141413] sm:h-40 sm:w-40">
        <span
          className={cn(
            'font-mono text-[11px] uppercase tracking-widest sm:text-[12px]',
            statusColor[phase]
          )}
        >
          {STATUS_LABEL[phase]}
        </span>
        {showBars && (
          <div className="mt-2.5 flex h-5 items-end justify-center gap-1.5" aria-hidden>
            {BAR_STYLES.map((bar, i) => (
              <span
                key={i}
                className={cn('w-1 animate-bounce rounded-full', bar.h, bar.color)}
                style={{ animationDuration: bar.dur }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
