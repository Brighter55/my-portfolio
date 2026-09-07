import { useState } from 'react'
import { Mic, PhoneOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import '../voiceTerminal.css'
import type { VoiceAgent } from '../useVoiceAgent'
import { demoCopy } from '../model'
import { VoiceOrb } from './VoiceOrb'
import { Transcript } from './Transcript'
import { ConsolePanel } from './ConsolePanel'

function formatTime(totalSeconds: number) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

type Tab = 'agent' | 'console'

/** Dark voice-terminal console: tabs, voice orb, controls, transcript / console. */
export function VoiceTerminal({ voice }: { voice: VoiceAgent }) {
  const [tab, setTab] = useState<Tab>('agent')
  const { phase, running } = voice
  const canTalk = phase === 'idle' || phase === 'ended' || phase === 'error'

  const tabButton = (isActive: boolean) =>
    cn(
      'relative flex items-center gap-2 pb-3 font-medium transition-colors focus:outline-none',
      isActive ? 'text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
    )

  return (
    <section className="relative flex w-full min-h-[640px] flex-col overflow-hidden rounded-3xl border border-[#27272a] bg-[#141413] text-[#e4e4e7] shadow-2xl">
      {/* Tab bar */}
      <div className="flex items-center gap-8 border-b border-[#27272a] bg-[#171717] px-6 pt-4 text-sm">
        <button
          type="button"
          className={tabButton(tab === 'agent')}
          onClick={() => setTab('agent')}
        >
          Agent
          {running && (
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
              title="Live"
            />
          )}
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[#d946ef] shadow-[0_0_8px_#d946ef] transition-opacity',
              tab === 'agent' ? 'opacity-100' : 'opacity-0'
            )}
          />
        </button>
        <button
          type="button"
          className={tabButton(tab === 'console')}
          onClick={() => setTab('console')}
        >
          Console
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[#d946ef] shadow-[0_0_8px_#d946ef] transition-opacity',
              tab === 'console' ? 'opacity-100' : 'opacity-0'
            )}
          />
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 p-6 sm:p-8">
        {tab === 'agent' ? (
          <div className="flex h-full flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-4">
              <VoiceOrb phase={phase} running={running} />

              {running ? (
                <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <span>
                    LIVE CALL:{' '}
                    <span className="font-semibold text-zinc-200">
                      {formatTime(voice.callSeconds)}
                    </span>
                  </span>
                  <span className="text-zinc-600">|</span>
                  <span className="text-zinc-400">{demoCopy.liveLabel}</span>
                </div>
              ) : (
                <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                  The AI assistant takes orders conversationally over the
                  browser mic
                </p>
              )}
            </div>

            {/* Controls */}
            <div className="flex min-h-12 items-center">
              {canTalk ? (
                <button
                  type="button"
                  onClick={() => void voice.start()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4ade80] px-7 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg transition-all hover:bg-[#3ec974] hover:shadow-emerald-500/20 active:scale-[0.98]"
                >
                  <Mic className="h-5 w-5" aria-hidden />
                  {demoCopy.startLabel}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={voice.stop}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-400/60 bg-[#1a1a1c] px-6 py-2.5 text-sm font-medium text-zinc-100 shadow-sm transition-all hover:bg-[#222226] active:scale-[0.98]"
                >
                  <PhoneOff className="h-4 w-4" aria-hidden />
                  {demoCopy.endLabel}
                </button>
              )}
            </div>

            <Transcript
              lines={voice.transcript}
              order={voice.order}
              phase={phase}
              injectUserText={voice.injectUserText}
            />
          </div>
        ) : (
          <ConsolePanel lines={voice.consoleLines} />
        )}
      </div>
    </section>
  )
}
