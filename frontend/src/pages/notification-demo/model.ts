/**
 * Types, seeds & helpers for the pick-up notification simulator.
 *
 * Purely client-side — no backend. The shapes mirror the future Django +
 * Twilio API (backend/), so swapping these local seeds for real fetch
 * calls later should only touch this folder.
 *
 * Sample data is intentionally fictional: placeholder names (John Doe…)
 * and 555-01XX numbers, which NANP reserves for fiction.
 */

export type OrderStatus = 'pending' | 'notified'

export interface Order {
  /** 8-char uppercase board id, e.g. "ZR2Z67A2" (rendered as #ZR2Z67A2). */
  id: string
  status: OrderStatus
  /** Menu items — rendered joined with ", ". */
  dishes: string[]
  customer: string
  /** E.164 phone, e.g. "+13145550101". */
  phone: string
  createdAt: Date
  notifiedAt: Date | null
}

/** Form values as typed in the storefront simulator. */
export interface OrderForm {
  dishes: string
  customer: string
  phone: string
}

/** Starting values the form is pre-filled with (mirrors the Stitch screen). */
export const formDefaults: OrderForm = {
  dishes: 'Pad Thai, Thai Iced Tea',
  customer: 'John Doe',
  phone: '+13145550100',
}

export interface Preset {
  id: 'preset-a' | 'preset-b'
  /** Dishes line the form field takes; split on commas for the board. */
  dishes: string
  customer: string
  phone: string
}

/** E.164 US number the form accepts. */
export const phoneRegExp = /^\+1\d{10}$/

/** Parse the free-text dishes field into board line items. */
export function parseDishes(raw: string): string[] {
  return raw
    .split(',')
    .map((dish) => dish.trim())
    .filter(Boolean)
}

/** Masks everything but the first 8 chars, e.g. "+1314555…". */
export function maskPhone(phone: string) {
  return `${phone.slice(0, -4)}…`
}

const HOUR = 3_600_000
const hoursAgo = (hours: number) => new Date(Date.now() - hours * HOUR)

/**
 * Seeded board shown on load — mirrors the Stitch reference screen
 * (pending group first, then notified; new orders prepend on top).
 */
const seeded: Order[] = [
  {
    id: '8D081P9J',
    status: 'pending',
    dishes: ['Nua Sawaan', 'Fried Egg', 'Green beans'],
    customer: 'John Doe',
    phone: '+13145550101',
    createdAt: hoursAgo(25),
    notifiedAt: null,
  },
  {
    id: 'ZR2Z67A2',
    status: 'pending',
    dishes: ['Som Tum', 'Pad Thai'],
    customer: 'Jane Doe',
    phone: '+13145550102',
    createdAt: hoursAgo(26),
    notifiedAt: null,
  },
  {
    id: 'F2YFSJHT',
    status: 'pending',
    dishes: ['Drunken Noodles'],
    customer: 'John Smith',
    phone: '+13145550103',
    createdAt: hoursAgo(27),
    notifiedAt: null,
  },
  {
    id: 'CAR008DC',
    status: 'notified',
    dishes: ['Kaeng Daeng', 'Kaeng Keaw Waan'],
    customer: 'Jane Smith',
    phone: '+13145550104',
    createdAt: hoursAgo(28),
    notifiedAt: hoursAgo(27.25),
  },
  {
    id: 'EBP0W1H0',
    status: 'notified',
    dishes: ['Pad Thai', 'Pad See Ew'],
    customer: 'Richard Roe',
    phone: '+13145550105',
    createdAt: hoursAgo(29),
    notifiedAt: hoursAgo(28.1),
  },
  {
    id: 'MR568XXR',
    status: 'notified',
    dishes: ['Kaeng Keaw Waan'],
    customer: 'Jane Roe',
    phone: '+13145550106',
    createdAt: hoursAgo(30),
    notifiedAt: hoursAgo(29.1),
  },
]

/** Fresh copy of the seeded board (used for the initial state and reset). */
export function createInitialOrders(): Order[] {
  return seeded.map((order) => ({
    ...order,
    dishes: [...order.dishes],
    createdAt: new Date(order.createdAt),
    notifiedAt: order.notifiedAt ? new Date(order.notifiedAt) : null,
  }))
}

/** One-click storefront orders that pre-fill the form. */
export const presets: Preset[] = [
  {
    id: 'preset-a',
    dishes: 'Khao Soi, Spring Rolls',
    customer: 'Jane Doe',
    phone: '+13145550107',
  },
  {
    id: 'preset-b',
    dishes: 'Massaman Curry, White Rice',
    customer: 'John Smith',
    phone: '+13145550108',
  },
]

const ORDER_ID_ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ' // no I/O
/** Random 8-char board id that doesn't collide with the given ids. */
export function generateOrderId(existing: string[]): string {
  let id = ''
  do {
    id = Array.from(
      { length: 8 },
      () => ORDER_ID_ALPHABET[Math.floor(Math.random() * ORDER_ID_ALPHABET.length)]
    ).join('')
  } while (existing.includes(id))
  return id
}

/** Coarse relative stamp: "Just now" → "Nm ago" → "Nh ago" → "Nd ago". */
export function formatRelative(date: Date, now: number): string {
  const minutes = Math.floor(Math.max(0, now - date.getTime()) / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/** UI copy for the demo page (kept out of content.ts — demo domain). */
export const demoCopy = {
  /** Page title shown in the slim sticky header. */
  title: 'Chiang Mai Restaurant Pickup Notification App',
  backLabel: 'Projects',
  storefront: {
    title: 'Clover Online Order Simulator',
    description:
      'Staff can sync recent online orders and notify customers when their food is ready with one click, eliminating the manual process of looking up and typing customer phone numbers.',
    presetsLabel: 'Quick Preset Orders',
    dishesLabel: 'Dishes / Menu Items',
    customerLabel: 'Customer Name',
    phoneLabel: 'Mobile Phone (E.164)',
    submitLabel: 'Submit Online Order',
    dispatchedLabel: '✓ Dispatched to Kitchen',
    errors: {
      empty: 'Add the dishes and a customer name before submitting.',
      phone: 'Phone must be a US E.164 number, e.g. +13145550100.',
    },
  },
  board: {
    title: 'Order Notifications',
    refreshLabel: 'Refresh',
  },
  order: {
    pending: 'Pending',
    notified: 'Notified',
    newTag: 'NEW',
    ordered: 'Ordered',
    sendSms: 'Send SMS',
    dispatching: 'Dispatching…',
    smsSent: 'SMS sent',
  },
  toast: {
    sender: 'Chiang Mai Restaurant • SMS Notification',
    body: 'Hi, This is Chiang Mai Restaurant. Your order is ready to be picked up!',
    justNow: 'Just now',
    deliveredTo: 'Delivered via Twilio to:',
    closeLabel: 'Close notification preview',
  },
} as const
