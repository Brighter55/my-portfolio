/**
 * Single source of truth for all site copy & links.
 *
 * Everything user-editable lives here — components only consume these values.
 *
 * TODO(owner): replace the placeholder values marked below with your real
 * details before deploying:
 *   - site.email / site.contactEmail   (currently a placeholder)
 *   - site.resumeUrl                   (currently generic read.cv)
 *   - site.linkedinUrl                 (verify handle)
 *   - site.githubUrl                   (verify handle)
 * Project cards mirror the real repos under github.com/Brighter55
 * (ai-phone-ordering, sms-notification, landing-page, corecomp).
 */

/**
 * Internal route paths — shared by content links and the router (App.tsx)
 * so each route string lives in exactly one place.
 */
export const routePaths = {
  /** Interactive SMS pick-up notification simulator (frontend-only demo). */
  notificationDemo: '/demos/notification',
  /**
   * Live AI phone-ordering agent demo. Needs the backend/ Deepgram relay
   * running (see backend/README) — the agent answers over the browser mic.
   */
  chiangMaiDemo: '/demos/chiang-mai-ai',
} as const

export const site = {
  /** Name shown in the header masthead and footer. */
  name: 'Peter Sriphrakhun',
  /** Muted suffix next to the masthead name (desktop only). */
  tagline: 'SWE',
  role: 'Software Engineer · CS Major',
  email: 'sriphrakhunpiyawit@gmail.com', // TODO(owner): real email
  contactEmail: 'sriphrakhunpiyawit@gmail.com', // TODO(owner): real email
  /** Local PDF served from frontend/public/ at the site root. */
  resumeUrl: '/my-resume.pdf',
  linkedinUrl: 'https://www.linkedin.com/in/piyawit-sriphrakhun-a3956335a/', // TODO(owner): verify
  githubUrl: 'https://github.com/Brighter55', // TODO(owner): verify
} as const

export interface NavItem {
  label: string
  href?: string
  /** Items with a `projects` kind open a dropdown listing projects below. */
  kind?: 'link' | 'projects'
}

/** Header navigation — `Projects` opens a dropdown of the project cards. */
export const nav: { items: NavItem[]; ctaLabel: string } = {
  items: [
    { label: 'About Me', href: '#about', kind: 'link' },
    { label: 'Projects', href: '#projects', kind: 'projects' },
    { label: 'Contacts', href: '#contact', kind: 'link' },
    { label: 'Resume', href: site.resumeUrl, kind: 'link' },
  ],
  ctaLabel: 'Get in Touch',
}

export const hero = {
  /** Small mono eyebrow over the display headline. */
  eyebrow: 'Software Engineer, CS Major',
  /** Display headline — first line is the large editorial serif. */
  headline: 'Hello,',
  lead: "I'm Peter.",
  /**
   * Intro paragraph. Wording was lightly reconstructed from the Stitch
   * design and should be re-verified against the original screenshot.
   */
  paragraphs: [
    "I designed, built, and maintained the full stack behind my family's restaurant business — from simple projects like the landing page to an AI ordering agent that handles real customer orders.",
    "I'm looking for a SWE internship where I can write production code, learn how real teams ship, and most importantly to level up my skills",
  ],
  primaryCta: { label: 'Get in Touch', href: '#contact' },
  secondaryCta: { label: 'View Résumé', href: site.resumeUrl },
  /** Hero portrait shown beside the intro copy on wide screens. */
  image: {
    src: '/images/projects/hero.jpg',
    alt: 'Peter Sriphrakhun',
    /** Optional one-line caption rendered under the photo. Leave empty to hide. */
    caption: "Just to clarify I did not intern at Google, just went to their headquarter to see what's up",
  },
} as const

export interface Project {
  /** Mono eyebrow: Work | Project */
  category: 'Work' | 'Project'
  title: string
  /** Optional one-line status chip, e.g. "Deployed in 8 Cities". */
  status?: string
  /** Optional summary lines shown under the title. */
  description: string[]
  /** Tech tags rendered as mono chips (JetBrains Mono). */
  tags?: string[]
  /**
   * Demo actions render as pill buttons on the project card. `href: '#'`
   * keeps the pill inert (no dead links) until that demo ships a real
   * URL; any other `href` — e.g. routePaths.notificationDemo — renders
   * as a working internal link.
   */
  demo?: { label: string; icon: 'arrow' | 'play'; href: string; demo: true }
  /** External link shown as a mono anchor with ↗, e.g. live site / repo. */
  external?: { label: string; href: string }
  image: {
    src: string
    alt: string
  }
}

export const projects: Project[] = [
  {
    category: 'Work',
    title: 'Chiang Mai Restaurant Pickup Notification App',
    description: [
      "Staff can sync recent online orders and notify customers when their food is ready with one click, eliminating the manual process of looking up and typing customer phone numbers.",
    ],
    tags: ['Django', 'React', 'Twilio', 'Clover API', 'PostgreSQL'],
    demo: {
      label: 'Launch Demo',
      icon: 'arrow',
      href: routePaths.notificationDemo,
      demo: true,
    },
    image: {
      src: '/images/projects/notification-app.jpg',
      alt: 'Chiang Mai Restaurant Pickup Notification App',
    },
  },
  {
    category: 'Work',
    title: 'Chiang Mai Restaurant AI Phone Agent',
    description: [
      "Before, every call that went unanswered was a sale lost to a busy kitchen. Now, an AI assistant takes the order conversationally and pushes it straight to the restaurant's Clover POS.",
    ],
    tags: ['Deepgram', 'GPT-4o-mini', 'Twilio', 'Django', 'Clover API'],
    demo: {
      label: 'Try Simulator',
      icon: 'play',
      href: routePaths.chiangMaiDemo,
      demo: true,
    },
    image: {
      src: '/images/projects/ai-app.png',
      alt: 'Chiang Mai Restaurant AI Phone Agent',
    },
  },
  {
    category: 'Work',
    title: 'Chiang Mai Restaurant Landing Site',
    description: [
      'Landing site for Chiang Mai Thai Restaurant, Webster Groves, MO. A fast, mobile-first marketing and ordering site with hero video, menu, review highlights, photo gallery, SMS opt-in form, and SEO.',
    ],
    tags: ['React', 'TypeScript', 'Vite', 'Tailwind', 'JSON-LD SEO'],
    external: {
      label: 'chiangmaistl.com',
      href: 'https://chiangmaistl.com',
    },
    image: {
      src: '/vids/github-vid.mp4',
      alt: 'Chiang Mai Restaurant Landing Site',
    },
  },
  {
    category: 'Project',
    title: 'CoreComp — Stock Fundamentals Analyzer',
    description: [
      'Turns complex stock research into simple, chart-first dashboards. Search any U.S. company to explore 5 years of financial data, including revenue, profitability, valuation, and return metrics in one place.',
    ],
    tags: ['Django', 'React', 'WiseSheets API', 'PostgreSQL', 'Redis'],
    external: {
      label: 'corecomp.cc',
      href: 'https://corecomp.cc',
    },
    image: {
      src: '/vids/corecomp%20showcase.mp4',
      alt: 'CoreComp — Stock Fundamentals Analyzer',
    },
  },
]

export const projectsSection = {
  heading: 'Works & Projects',
  /** Row under the grid, linking out to the full archive. */
  moreLabel: 'For more projects',
  moreHref: site.githubUrl,
} as const

export interface ContactRow {
  index: string // '01'
  headline: string
  blurb: string
  /** Link label shown in mono, e.g. the handle or address. */
  linkLabel: string
  href: string
}

export const contact = {
  heading: 'Contacts',
  intro: 'I can be reached multiple ways but email works the best',
  rows: [
    {
      index: '01',
      headline: 'Email',
      blurb: 'For SWE internship opportunities, project collaborations, or tech discussions.',
      linkLabel: site.email,
      href: `mailto:${site.contactEmail}`,
    },
    {
      index: '02',
      headline: 'LinkedIn',
      blurb: 'Connect professionally, view background, and stay in touch on career updates.',
      linkLabel: site.linkedinUrl.replace(/^https?:\/\//, ''),
      href: site.linkedinUrl,
    },
    {
      index: '03',
      headline: 'GitHub',
      blurb: 'Explore source code, public repos, side-projects, and engineering experiments.',
      linkLabel: site.githubUrl.replace(/^https?:\/\//, ''),
      href: site.githubUrl,
    },
  ] satisfies ContactRow[],
} as const

export const footer = {
  links: [
    { label: 'GitHub', href: site.githubUrl },
    { label: 'Résumé', href: site.resumeUrl },
    { label: 'Email', href: `mailto:${site.contactEmail}` },
  ],
  copyright: '© 2026 Peter Sriphrakhun',
} as const
