import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { site } from '@/data/content'
import { demoCopy } from '../model'

/** Slim sticky breadcrumb bar matching the Warm Monolith design. */
export function DemoHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-canvas/90 backdrop-blur-md">
      <div className="site-container flex h-[68px] items-center gap-3 sm:gap-6">
        <Link
          to="/#projects"
          className="group inline-flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden />
          <span className="truncate font-medium text-ink">{site.name}</span>
          <span aria-hidden className="shrink-0 text-ink-faint">
            /
          </span>
          <span className="shrink-0">{demoCopy.breadcrumbBack}</span>
        </Link>
        <span aria-hidden className="hidden size-1.5 shrink-0 rounded-full bg-ink/20 md:inline-block" />
        <h1 className="hidden min-w-0 truncate text-[13px] font-semibold tracking-tight text-ink md:block">
          {demoCopy.breadcrumbTitle}
        </h1>
      </div>
    </header>
  )
}
