/**
 * Shared copy + types for the Chiang Mai AI ordering-agent demo page.
 * Copy is largely ported from the Stitch "AI Phone Agent Demo" screen.
 */

export type Phase =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'processing'
  | 'ended'
  | 'error'

export const STATUS_LABEL: Record<Phase, string> = {
  idle: 'STANDBY',
  connecting: 'CONNECTING',
  listening: 'LISTENING',
  speaking: 'SPEAKING',
  processing: 'PROCESSING',
  ended: 'CALL ENDED',
  error: 'ERROR',
}

export interface TranscriptLine {
  id: string
  role: 'agent' | 'user'
  text: string
}

export type ConsoleLevel = 'info' | 'ok' | 'warn' | 'err'

export interface ConsoleLine {
  id: string
  time: string
  level: ConsoleLevel
  text: string
}

export interface OrderItem {
  name?: string
  quantity?: number
  price?: number
  notes?: string
}

export interface OrderSummary {
  customer_name?: string
  items?: OrderItem[]
  total?: number
  notes?: string
  note?: string
}

/** Sample menu card — the three items the agent can actually take. */
export const MENU_ITEMS = [
  {
    name: 'Pad Thai',
    thai: 'ผัดไทย',
    price: '$17.59',
    phrase: "I'd like a Pad Thai with chicken and mild spice, please.",
  },
  {
    name: 'Drunken Noodles',
    thai: 'ผัดขี้เมา',
    price: '$17.59',
    phrase: "Can I get one Drunken Noodles with chicken, mild spice?",
  },
  {
    name: 'Chicken Noodle Soup',
    thai: 'ก๋วยเตี๋ยวไก่',
    price: '$14.49',
    phrase: "I'll have a Chicken Noodle Soup, please.",
  },
] as const

/** "Customer Speech Injection" chips shown under the live transcript. */
export const QUICK_REPLIES = [
  "I'd like 2 Pad Thai with chicken and mild spice",
  'Do you have vegan spring rolls available?',
  'How long will pickup take right now?',
] as const

export const demoCopy = {
  breadcrumbBack: 'Projects',
  breadcrumbTitle: 'Chiang Mai AI Phone Ordering Agent',
  title: 'Chiang Mai AI Ordering Agent',
  lead: 'Before, every call that went unanswered was a sale lost to a busy kitchen. Now, an AI assistant takes the order conversationally and pushes it straight to the restaurant’s Clover POS.',
  tags: ['Deepgram Nova-3', 'GPT-4o-mini', 'Aura TTS', 'Django Channels'],
  menuHint: 'Here are the sample items you can order with the AI',
  liveLabel: 'Chiang Mai Thai Kitchen',
  startLabel: 'Talk To Your Agent',
  endLabel: 'End Conversation',
  injectionLabel: 'Customer Speech Injection',
  orbListening: 'LISTENING',
} as const

export const INITIAL_GREETING =
  'Thank you for calling Chiang Mai. All our staff are currently busy assisting other customers, but I can take your order right away. What can I get for you today?'
