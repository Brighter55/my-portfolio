import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { projects, projectsSection, type Project } from '@/data/content'
import { Button } from '@/components/ui/button'

const demoIcon = { arrow: ArrowRight, play: Play }

/** True when a project's media source is a video file rather than an image. */
function isVideo(src: string) {
  return /\.(mp4|webm|ogg)$/i.test(src)
}

function ProjectMedia({ project }: { project: Project }) {
  if (isVideo(project.image.src)) {
    return (
      <video
        src={project.image.src}
        aria-label={project.image.alt}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="pointer-events-none aspect-video w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] md:absolute md:inset-0 md:size-full"
      />
    )
  }
  return (
    <img
      src={project.image.src}
      alt={project.image.alt}
      loading="lazy"
      className="aspect-video w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] md:absolute md:inset-0 md:size-full"
    />
  )
}

function DemoPill({ project }: { project: Project }) {
  const action = project.demo!
  const Icon = demoIcon[action.icon]
  /* Live once the demo ships a real route — see content.ts `demo` docs. */
  const isLive = action.href !== '#'
  return (
    <Button
      asChild
      variant="default"
      className="h-9 rounded-full px-4 text-[13px]"
      {...(!isLive && { title: 'Demo ships with the backend milestone' })}
    >
      {isLive ? (
        <Link to={action.href}>
          {action.label}
          <Icon className="size-3.5" />
        </Link>
      ) : (
        <a
          href={action.href}
          aria-disabled="true"
          onClick={(event) => event.preventDefault()}
        >
          {action.label}
          <Icon className="size-3.5" />
        </a>
      )}
    </Button>
  )
}

function ProjectCard({
  project,
  index,
}: {
  project: Project
  index: number
}) {
  const mediaRight = index % 2 === 1
  return (
    <article
      id={`project-${index + 1}`}
      className="card-warm group grid scroll-mt-28 overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-ink/25 md:grid-cols-12"
    >
      {/* Media */}
      <div
        className={cn(
          'relative overflow-hidden bg-ink/5 md:col-span-7',
          mediaRight && 'md:order-2'
        )}
      >
        <ProjectMedia project={project} />
      </div>

      {/* Body */}
      <div
        className={cn(
          'flex flex-col gap-4 p-6 md:col-span-5 md:p-8',
          mediaRight && 'md:order-1'
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="label-mono text-ink-soft">{project.category}</span>
          {project.status && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-paper px-2.5 py-1">
              <span aria-hidden className="size-1.5 rounded-full bg-forest" />
              <span className="label-mono text-ink">{project.status}</span>
            </span>
          )}
        </div>

        <h3 className="text-h-card text-ink">{project.title}</h3>

        <div className="space-y-2.5 text-sm leading-relaxed text-ink-soft">
          {project.description.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>

        {project.tags && (
          <ul className="flex flex-wrap gap-2" aria-label="Technologies">
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-[4px] border border-ink/12 bg-paper px-2 py-1 font-mono text-[11px] tracking-[-0.01em] text-ink/70"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-2">
          {project.demo ? (
            <DemoPill project={project} />
          ) : (
            project.external && (
              <a
                href={project.external.href}
                target="_blank"
                rel="noreferrer noopener"
                className="group/link inline-flex items-center gap-1.5 font-mono text-[13px] text-ink underline decoration-ink/25 decoration-[1px] underline-offset-4 transition-colors hover:decoration-ink"
              >
                {project.external.label}
                <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
              </a>
            )
          )}
        </div>
      </div>
    </article>
  )
}

export function Projects() {
  return (
    <section id="projects" className="site-container scroll-mt-24 py-20 md:py-28">
      <h2 className="text-h-section text-ink">{projectsSection.heading}</h2>

      <div className="mt-12 flex flex-col gap-8 md:mt-16 md:gap-12">
        {projects.map((project, index) => (
          <ProjectCard key={project.title} project={project} index={index} />
        ))}
      </div>

      <a
        href={projectsSection.moreHref}
        target="_blank"
        rel="noreferrer noopener"
        className="group/link mt-12 inline-flex items-center gap-2 text-[13px] font-medium text-ink-soft transition-colors hover:text-ink"
      >
        {projectsSection.moreLabel}
        <ArrowRight className="size-4 transition-transform duration-200 group-hover/link:translate-x-1" />
      </a>
    </section>
  )
}
