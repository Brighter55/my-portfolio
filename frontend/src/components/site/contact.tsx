import { ArrowUpRight } from 'lucide-react'
import { contact } from '@/data/content'

export function Contact() {
  return (
    <section id="contact" className="site-container scroll-mt-24 py-20 md:py-28">
      <h2 className="text-h-section text-ink">{contact.heading}</h2>
      <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink-soft md:text-base">
        {contact.intro}
      </p>

      <div className="mt-10 border-t border-ink/10 md:mt-14">
        {contact.rows.map((row) => {
          const isMailto = row.href.startsWith('mailto:')
          return (
            <a
              key={row.headline}
              href={row.href}
              {...(isMailto ? {} : { target: '_blank', rel: 'noreferrer noopener' })}
              className="group grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-2 border-b border-ink/10 py-6 transition-colors hover:bg-muted/40 md:grid-cols-12 md:items-center md:gap-x-8 md:py-8"
            >
              <span className="font-mono text-xs text-ink-faint md:col-span-1">
                {row.index}
              </span>

              <span className="md:col-span-3">
                <span className="text-h-card text-ink transition-colors group-hover:text-ink">
                  {row.headline}
                </span>
              </span>

              <span className="col-span-2 col-start-2 text-sm leading-relaxed text-ink-soft md:col-span-4 md:col-start-auto">
                {row.blurb}
              </span>

              <span className="col-span-2 col-start-2 mt-1 inline-flex items-center gap-1.5 font-mono text-[13px] text-ink-soft underline decoration-ink/20 decoration-[1px] underline-offset-4 transition-colors group-hover:text-ink group-hover:decoration-ink md:col-span-4 md:col-start-auto md:mt-0 md:justify-self-end">
                {row.linkLabel}
                <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </a>
          )
        })}
      </div>
    </section>
  )
}
