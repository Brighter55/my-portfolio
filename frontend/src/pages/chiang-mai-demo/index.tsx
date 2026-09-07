import { Footer } from '@/components/site/footer'
import { DemoHeader } from './components/DemoHeader'
import { InfoColumn } from './components/InfoColumn'
import { VoiceTerminal } from './components/VoiceTerminal'
import { useVoiceAgent } from './useVoiceAgent'

/** A live browser-voice demo of the Chiang Mai AI phone-ordering agent. */
export default function ChiangMaiDemoPage() {
  const voice = useVoiceAgent()

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <DemoHeader />

      {(voice.fatal || voice.statusBanner) && (
        <div className="site-container mt-4">
          {voice.fatal ? (
            <div
              role="alert"
              className="rounded-lg border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 font-mono text-[12px] leading-relaxed text-[#93000a]"
            >
              {voice.fatal}
            </div>
          ) : (
            <div
              role="status"
              className="rounded-lg border border-amber/25 bg-beige px-4 py-3 font-mono text-[12px] leading-relaxed text-amber"
            >
              {voice.statusBanner}
            </div>
          )}
        </div>
      )}

      <main className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:px-8">
        {/* Voice terminal — shown first on mobile (order-1), right column on lg. */}
        <div className="order-1 flex w-full flex-col items-center lg:order-2 lg:flex-1">
          <VoiceTerminal voice={voice} />
        </div>

        {/* Editorial spec + sample menu — below the terminal on mobile. */}
        <div className="order-2 w-full lg:order-1 lg:w-[440px]">
          <InfoColumn phase={voice.phase} injectUserText={voice.injectUserText} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
