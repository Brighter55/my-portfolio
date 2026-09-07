import { site, footer as footerContent } from '@/data/content'

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="site-container border-t border-ink/10 py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="flex items-baseline gap-2.5">
            <span className="font-display text-xl tracking-[-0.02em] text-ink">
              {site.name}
            </span>
            <span aria-hidden className="size-[3px] rounded-full bg-ink-faint" />
            <span className="hidden text-[13px] text-ink-soft sm:inline">
              {site.tagline}
            </span>
          </p>

          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center gap-x-7 gap-y-3"
          >
            {footerContent.links.map((link) => {
              const opensNewTab = link.href.startsWith('http')
              return (
                <a
                  key={link.label}
                  href={link.href}
                  {...(opensNewTab ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                  className="text-[13px] font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  {link.label}
                </a>
              )
            })}
          </nav>

          <p className="font-mono text-[11px] tracking-wide text-ink-faint">
            {footerContent.copyright}
          </p>
        </div>
      </div>
    </footer>
  )
}
