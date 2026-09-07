import { hero } from '@/data/content'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section id="about" className="site-container scroll-mt-24">
      <div className="grid items-center gap-10 py-20 md:grid-cols-12 md:gap-8 md:py-28">
        {/* Intro copy */}
        <div className="max-w-170 md:col-span-7">
          <p className="flex items-center gap-3 text-ink-soft">
            <span aria-hidden className="h-px w-7 bg-ink/25" />
            <span className="label-mono">{hero.eyebrow}</span>
          </p>

          <h1 className="text-display mt-9 text-ink">
            {hero.headline}
            <span className="block">{hero.lead}</span>
          </h1>

          <div className="mt-7 space-y-4 text-[15px] leading-relaxed text-ink-soft md:text-base md:leading-relaxed">
            {hero.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild variant="default" className="h-11 rounded-lg px-6">
              <a href={hero.primaryCta.href}>{hero.primaryCta.label}</a>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-lg px-6">
              <a href={hero.secondaryCta.href}>{hero.secondaryCta.label}</a>
            </Button>
          </div>

          <p className="mt-9 flex items-center gap-2.5 font-mono text-xs text-ink-soft">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-forest opacity-30" />
              <span className="relative inline-flex size-2 rounded-full bg-forest" />
            </span>
            Open to SWE internships
          </p>
        </div>

        {/* Hero portrait */}
        <figure className="md:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-ink/10 shadow-card">
            <img
              src={hero.image.src}
              alt={hero.image.alt}
              loading="eager"
              className="block h-auto w-full"
            />
          </div>
          {hero.image.caption && (
            <figcaption className="mt-3 text-center font-mono text-[11px] tracking-[0.02em] text-ink-soft">
              {hero.image.caption}
            </figcaption>
          )}
        </figure>
      </div>
    </section>
  )
}
