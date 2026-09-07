import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Menu,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { nav, projects, site, type Project } from '@/data/content'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

/** Track which anchored section is currently in view (for the nav underline). */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string>()
  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (sections.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`)
        }
      },
      { rootMargin: '-30% 0px -60% 0px' }
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [ids.join('|')])
  return active
}

const sectionIds = ['about', 'projects', 'contact']

function Masthead({ className }: { className?: string }) {
  return (
    <a
      href="#top"
      className={cn('group flex items-center gap-2.5', className)}
      aria-label="Back to top"
    >
      <span className="font-display text-[21px] leading-none tracking-[-0.02em] text-ink">
        {site.name}
      </span>
      <span
        aria-hidden
        className="size-[3px] rounded-full bg-ink-faint transition-colors group-hover:bg-ink/40"
      />
      <span className="hidden text-[13px] text-ink-soft md:inline">{site.tagline}</span>
    </a>
  )
}

/**
 * A project's dropdown destination: its demo page (internal route) when it
 * has one, otherwise its live/external link. Falls back to the on-page card
 * anchor only if a project has neither (none do today).
 */
type ProjectAction =
  | { kind: 'demo'; href: string; icon: LucideIcon }
  | { kind: 'external'; href: string; icon: LucideIcon }
  | { kind: 'section'; href: string; icon?: LucideIcon }

function projectAction(project: Project, index: number): ProjectAction {
  if (project.demo)
    return { kind: 'demo', href: project.demo.href, icon: ArrowRight }
  if (project.external)
    return { kind: 'external', href: project.external.href, icon: ArrowUpRight }
  return { kind: 'section', href: `#project-${index + 1}` }
}

/** One project row, shared by the desktop dropdown and the mobile sheet. */
function ProjectNavRow({
  project,
  index,
  className,
}: {
  project: Project
  index: number
  className: string
}) {
  const action = projectAction(project, index)
  const label =
    action.kind === 'section'
      ? project.category
      : action.kind === 'demo'
        ? 'Demo'
        : 'Live site'
  const content = (
    <>
      <span className="truncate">{project.title}</span>
      <span className="label-mono inline-flex shrink-0 items-center gap-1.5 text-ink-faint">
        {action.kind !== 'section' && <action.icon className="size-3.5" />}
        {label}
      </span>
    </>
  )
  if (action.kind === 'demo') {
    return (
      <Link
        to={action.href}
        className={cn('flex items-center justify-between gap-3', className)}
      >
        {content}
      </Link>
    )
  }
  return (
    <a
      href={action.href}
      {...(action.kind === 'external'
        ? { target: '_blank', rel: 'noreferrer noopener' }
        : {})}
      className={cn('flex items-center justify-between gap-3', className)}
    >
      {content}
    </a>
  )
}

/** Desktop hover / focus-within dropdown to the four projects' live pages. */
function ProjectsDropdown({ active }: { active?: string }) {
  const isActive = active === '#projects'
  return (
    <div className="group/dd relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded="false"
        className={cn(
          'inline-flex items-center gap-1 rounded-sm pb-1.5 pt-1 text-[13px] font-medium transition-colors',
          isActive ? 'text-ink' : 'text-ink-soft hover:text-ink'
        )}
      >
        Projects
        <ChevronDown
          className="size-3.5 transition-transform duration-200 group-hover/dd:rotate-180 group-focus-within/dd:rotate-180"
          strokeWidth={2}
        />
      </button>
      <div className="pointer-events-none absolute right-0 top-full pt-3 opacity-0 transition-all duration-200 group-hover/dd:pointer-events-auto group-hover/dd:opacity-100 group-hover/dd:translate-y-0 group-focus-within/dd:pointer-events-auto group-focus-within/dd:opacity-100 group-focus-within/dd:translate-y-0 translate-y-1">
        <ul className="w-[19rem] rounded-xl border border-ink/10 bg-paper p-1.5 shadow-float">
          {projects.map((project, index) => (
            <li key={project.title}>
              <ProjectNavRow
                project={project}
                index={index}
                className="rounded-lg px-3 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-muted"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function DesktopNav({ active }: { active?: string }) {
  return (
    <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
      {nav.items.map((item) => {
        if (item.kind === 'projects') return <ProjectsDropdown key={item.label} active={active} />
        const isActive = item.href?.startsWith('#') && item.href === active
        return (
          <a
            key={item.label}
            href={item.href}
            {...(item.href?.startsWith('http') || item.href?.startsWith('mailto')
              ? { target: '_blank', rel: 'noreferrer noopener' }
              : {})}
            className={cn(
              'border-b-[1.5px] pb-1 text-[13px] font-medium transition-colors',
              isActive
                ? 'border-ink text-ink'
                : 'border-transparent text-ink-soft hover:text-ink'
            )}
          >
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}

/** Mobile drawer navigation (Sheet). */
function MobileNav() {
  const sectionLink =
    'block border-b border-ink/8 py-3.5 text-[15px] font-medium text-ink transition-colors'
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-ink md:hidden"
          aria-label="Open menu"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="border-l-ink/10 bg-canvas">
        <SheetHeader>
          <SheetTitle className="font-display text-xl tracking-tight text-ink">
            {site.name}
          </SheetTitle>
          <SheetDescription className="hidden">
            Site navigation for {site.name} — {site.tagline}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4">
          {nav.items.map((item) => {
            if (item.kind === 'projects') {
              return (
                <div key={item.label}>
                  <p className="label-mono pb-2 pt-4 text-ink-faint">
                    {item.label}
                  </p>
                  {projects.map((project, index) => (
                    <ProjectNavRow
                      key={project.title}
                      project={project}
                      index={index}
                      className="border-b border-ink/8 py-3 text-[15px] text-ink/80 transition-colors hover:text-ink"
                    />
                  ))}
                </div>
              )
            }
            return (
              <a
                key={item.label}
                href={item.href}
                {...(item.href?.startsWith('http') || item.href?.startsWith('mailto')
                  ? { target: '_blank', rel: 'noreferrer noopener' }
                  : {})}
                className={cn(sectionLink, 'mt-4 first:mt-0')}
              >
                {item.label}
              </a>
            )
          })}
        </div>
        <SheetFooter>
          <Button asChild className="h-11 w-full" variant="default">
            <a href={`mailto:${site.contactEmail}`}>{nav.ctaLabel}</a>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function Header() {
  const active = useActiveSection(sectionIds)
  return (
    <header className="sticky top-0 z-40 border-b border-ink/8 bg-canvas/85 backdrop-blur-md">
      <div className="site-container flex h-[68px] items-center justify-between gap-6">
        <Masthead />
        <DesktopNav active={active} />
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="default"
            className="hidden h-9 rounded-lg px-4 text-[13px] font-medium md:inline-flex"
          >
            <a href={`mailto:${site.contactEmail}`}>{nav.ctaLabel}</a>
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
