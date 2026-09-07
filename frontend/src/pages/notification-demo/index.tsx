import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { site } from '@/data/content'
import { Footer } from '@/components/site/footer'
import type { Order, OrderForm, Preset } from './model'
import {
  createInitialOrders,
  demoCopy,
  formDefaults,
  generateOrderId,
  parseDishes,
  phoneRegExp,
} from './model'
import { BoardPanel, SmsToast, StorefrontPanel } from './panels'
import type { SmsToastData } from './panels'

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

/** Ticks every 30s so relative stamps ("Just now") age on their own. */
function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

/** Slim sticky bar: back link · page title. */
function Masthead() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-x-6 gap-y-2 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/#projects"
            className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink sm:text-sm"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            <span>{site.name}</span>
            <span aria-hidden className="text-ink-faint">
              /
            </span>
            <span className="font-semibold text-ink">{demoCopy.backLabel}</span>
          </Link>
          <span
            aria-hidden
            className="hidden size-1.5 shrink-0 rounded-full bg-ink/20 sm:inline-block"
          />
          <h1 className="truncate text-xs font-semibold tracking-tight text-ink sm:text-sm">
            {demoCopy.title}
          </h1>
        </div>
      </div>
    </header>
  )
}

export default function NotificationDemoPage() {
  const now = useNow()
  const [orders, setOrders] = useState<Order[]>(createInitialOrders)
  const [form, setForm] = useState<OrderForm>(formDefaults)
  const [error, setError] = useState<string | null>(null)
  /** ~1.8s "✓ Dispatched to Kitchen" flash + ring/NEW chip on the new card. */
  const [dispatched, setDispatched] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [dispatchingId, setDispatchingId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [toast, setToast] = useState<SmsToastData | null>(null)

  const isBusy = dispatchingId !== null || isRefreshing

  useEffect(() => {
    if (!dispatched) return
    const id = window.setTimeout(() => {
      setDispatched(false)
      setHighlightedId(null)
    }, 1800)
    return () => window.clearTimeout(id)
  }, [dispatched])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 5500)
    return () => window.clearTimeout(id)
  }, [toast])

  function handleFieldChange(field: keyof OrderForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    if (error) setError(null)
  }

  function handlePreset(preset: Preset) {
    setForm({ dishes: preset.dishes, customer: preset.customer, phone: preset.phone })
    setError(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const dishes = parseDishes(form.dishes)
    const customer = form.customer.trim()
    const phone = form.phone.trim()
    if (dishes.length === 0 || customer === '') {
      setError(demoCopy.storefront.errors.empty)
      return
    }
    if (!phoneRegExp.test(phone)) {
      setError(demoCopy.storefront.errors.phone)
      return
    }
    setError(null)
    const order: Order = {
      id: generateOrderId(orders.map((candidate) => candidate.id)),
      status: 'pending',
      dishes,
      customer,
      phone,
      createdAt: new Date(),
      notifiedAt: null,
    }
    setOrders((current) => [order, ...current])
    setForm({ ...formDefaults })
    setHighlightedId(order.id)
    setDispatched(true)
  }

  async function handleSendSms(orderId: string) {
    if (isBusy) return
    const order = orders.find((candidate) => candidate.id === orderId)
    if (!order || order.status !== 'pending') return
    setDispatchingId(orderId)
    await sleep(450) // simulated Twilio dispatch
    const notifiedAt = new Date()
    setOrders((current) =>
      current.map((candidate) =>
        candidate.id === orderId
          ? { ...candidate, status: 'notified', notifiedAt }
          : candidate
      )
    )
    setToast({ phone: order.phone })
    setDispatchingId(null)
  }

  async function handleRefresh() {
    if (isBusy) return
    setIsRefreshing(true)
    await sleep(700) // simulated re-poll of the Clover POS
    setIsRefreshing(false)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <Masthead />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12 xl:gap-8">
          <div className="xl:col-span-4">
            <StorefrontPanel
              form={form}
              error={error}
              dispatched={dispatched}
              onChange={handleFieldChange}
              onPreset={handlePreset}
              onSubmit={handleSubmit}
            />
          </div>
          <div className="xl:col-span-8">
            <BoardPanel
              orders={orders}
              now={now}
              highlightedId={highlightedId}
              dispatchingId={dispatchingId}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
              onSendSms={handleSendSms}
            />
          </div>
        </div>
      </main>

      <Footer />
      <SmsToast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
