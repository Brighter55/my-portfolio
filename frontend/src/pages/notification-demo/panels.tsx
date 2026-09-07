import type { FormEvent } from 'react'
import {
  Bell,
  Check,
  Clock,
  LoaderCircle,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  User,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Order, OrderForm, Preset } from './model'
import { demoCopy, formatRelative, maskPhone, presets } from './model'

/* ------------------------------------------------------------------ */
/* Clover Online Order Simulator — light panel (left)                 */
/* ------------------------------------------------------------------ */

interface FieldProps {
  id: string
  label: string
  value: string
  placeholder: string
  mono?: boolean
  onChange: (value: string) => void
}

function Field({ id, label, value, placeholder, mono, onChange }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'w-full rounded-lg border border-ink/15 bg-paper px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-tan focus:ring-2 focus:ring-tan/30',
          mono && 'font-mono text-[13px]'
        )}
      />
    </div>
  )
}

interface StorefrontPanelProps {
  form: OrderForm
  error: string | null
  /** True for the ~1.8s "✓ Dispatched to Kitchen" flash after submitting. */
  dispatched: boolean
  onChange: (field: keyof OrderForm, value: string) => void
  onPreset: (preset: Preset) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function StorefrontPanel({
  form,
  error,
  dispatched,
  onChange,
  onPreset,
  onSubmit,
}: StorefrontPanelProps) {
  const { storefront } = demoCopy
  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm">
      <header className="border-b border-ink/10 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-ink">{storefront.title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">{storefront.description}</p>
      </header>

      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
          {storefront.presetsLabel}
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPreset(preset)}
              className="rounded-lg border border-ink/15 p-2 text-left transition hover:border-tan hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tan/40"
            >
              <p className="truncate text-[13px] font-medium text-ink">{preset.dishes}</p>
              <p className="mt-0.5 truncate text-[10px] text-ink-soft">
                {preset.customer} · {maskPhone(preset.phone)}
              </p>
            </button>
          ))}
        </div>
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <Field
          id="order-items"
          label={storefront.dishesLabel}
          value={form.dishes}
          placeholder="e.g. Pad Kra Pao, Fried Tofu"
          onChange={(value) => onChange('dishes', value)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="order-name"
            label={storefront.customerLabel}
            value={form.customer}
            placeholder="First & Last Name"
            onChange={(value) => onChange('customer', value)}
          />
          <Field
            id="order-phone"
            label={storefront.phoneLabel}
            value={form.phone}
            placeholder="+1XXXXXXXXXX"
            mono
            onChange={(value) => onChange('phone', value)}
          />
        </div>

        {error && (
          <p role="alert" className="text-xs font-medium leading-snug text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          className={cn(
            'mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-paper shadow-sm transition active:scale-[0.99]',
            dispatched ? 'bg-[#065f46]' : 'bg-ink hover:bg-black'
          )}
        >
          {dispatched ? (
            <span>{storefront.dispatchedLabel}</span>
          ) : (
            <>
              <Plus className="size-4 text-tan" aria-hidden />
              {storefront.submitLabel}
            </>
          )}
        </button>
      </form>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Kitchen Notification Board — dark console panel (right)             */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: Order['status'] }) {
  const pending = status === 'pending'
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
        pending
          ? 'border border-tan/25 bg-tan/10 text-tan'
          : 'border border-canvas/10 bg-canvas/[0.05] text-canvas/50'
      )}
    >
      {pending ? demoCopy.order.pending : demoCopy.order.notified}
    </span>
  )
}

interface OrderCardProps {
  order: Order
  now: number
  /** Freshly submitted card keeps its ring + NEW chip for ~1.8s. */
  highlight: boolean
  /** True while this card's SMS is dispatching. */
  isDispatching: boolean
  /** Any dispatch in flight disables the other Send buttons. */
  isBusy: boolean
  onSendSms: (orderId: string) => void
}

function OrderCard({ order, now, highlight, isDispatching, isBusy, onSendSms }: OrderCardProps) {
  const { order: copy } = demoCopy
  const notified = order.status === 'notified'
  const soft = notified ? 'text-canvas/45' : 'text-canvas/70'
  const stamps = notified
    ? `${copy.ordered} ${formatRelative(order.createdAt, now)} · ${copy.notified} ${formatRelative(order.notifiedAt!, now)}`
    : `${copy.ordered} ${formatRelative(order.createdAt, now)}`
  return (
    <article
      className={cn(
        'flex flex-col justify-between rounded-2xl border bg-well p-5 transition-all duration-200',
        notified
          ? 'border-well-line'
          : 'border-[#2c2b27] hover:border-[#3e3c36]',
        highlight && 'ring-1 ring-tan/40'
      )}
    >
      <div>
        {/* Order header row */}
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <span
            className={cn(
              'flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide',
              notified ? 'text-canvas/40' : 'text-canvas/60'
            )}
          >
            ORDER #{order.id}
            {highlight && (
              <span className="rounded bg-[#fbbf24]/15 px-1.5 py-0.5 font-mono text-[10px] font-medium normal-case tracking-normal text-[#fbbf24]">
                {copy.newTag}
              </span>
            )}
          </span>
          <StatusBadge status={order.status} />
        </div>

        {/* Menu items */}
        <h3
          className={cn(
            'mb-4 line-clamp-1 text-base font-semibold tracking-tight sm:text-lg',
            notified ? 'text-canvas/85' : 'text-canvas'
          )}
        >
          {order.dishes.join(', ')}
        </h3>

        {/* Customer + phone capsule */}
        <div
          className={cn(
            'mb-4 grid grid-cols-1 divide-y divide-well-line overflow-hidden rounded-xl border border-well-line bg-well-deep sm:grid-cols-12 sm:divide-x sm:divide-y-0'
          )}
        >
          <div
            className={cn(
              'flex min-w-0 items-center gap-2 truncate px-3 py-2 text-xs sm:col-span-6',
              notified ? 'text-canvas/55' : 'text-canvas/75'
            )}
          >
            <User className="size-3.5 shrink-0 text-canvas/30" aria-hidden />
            <span className="truncate font-medium">{order.customer}</span>
          </div>
          <div
            className={cn(
              'flex min-w-0 items-center gap-2 truncate px-3 py-2 font-mono text-[11px] sm:col-span-6',
              notified ? 'text-canvas/40' : 'text-canvas/60'
            )}
          >
            <Phone className="size-3.5 shrink-0 text-canvas/30" aria-hidden />
            <span className="truncate">{order.phone}</span>
          </div>
        </div>

        {/* Timestamps */}
        <p className={cn('mb-5 flex items-center gap-1.5 font-mono text-[11px]', soft)}>
          <Clock className="size-3.5 text-canvas/25" aria-hidden />
          {stamps}
        </p>
      </div>

      {/* Bottom action area */}
      {notified ? (
        <div className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-canvas/50">
          <Check className="size-4" aria-hidden />
          {copy.smsSent}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onSendSms(order.id)}
          disabled={isBusy}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-tan px-4 py-2.5 text-sm font-medium text-ink shadow transition hover:bg-tan-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80"
        >
          {isDispatching ? (
            <>
              <LoaderCircle className="size-4 animate-spin text-ink" aria-hidden />
              {copy.dispatching}
            </>
          ) : (
            <>
              <MessageCircle className="size-4 text-ink" aria-hidden />
              {copy.sendSms}
            </>
          )}
        </button>
      )}
    </article>
  )
}

interface BoardPanelProps {
  orders: Order[]
  now: number
  highlightedId: string | null
  dispatchingId: string | null
  isRefreshing: boolean
  onRefresh: () => void
  onSendSms: (orderId: string) => void
}

export function BoardPanel({
  orders,
  now,
  highlightedId,
  dispatchingId,
  isRefreshing,
  onRefresh,
  onSendSms,
}: BoardPanelProps) {
  const { board } = demoCopy
  const pendingCount = orders.filter((order) => order.status === 'pending').length
  return (
    <section className="flex min-h-[720px] flex-col overflow-hidden rounded-3xl border border-well-line bg-ink p-4 text-canvas shadow-2xl sm:p-7">
      {/* Panel header bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#23221f] pb-6">
        <div className="flex items-center gap-3.5">
          <span className="flex size-10 items-center justify-center rounded-2xl border border-[#2e2d29] bg-[#22211e] shadow-inner">
            <Bell className="size-5 text-tan" aria-hidden />
          </span>
          <div className="flex items-center gap-3">
            <h2 className="font-sans text-xl font-bold tracking-tight text-canvas sm:text-2xl">
              {board.title}
            </h2>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium sm:text-sm',
                pendingCount === 0
                  ? 'border-canvas/10 bg-canvas/[0.04] text-canvas/50'
                  : 'border-[#3b3832] bg-[#272622] text-tan'
              )}
            >
              <span className="relative flex size-1.5" aria-hidden>
                <span
                  className={cn(
                    'absolute inline-flex size-full rounded-full opacity-60',
                    pendingCount === 0 ? '' : 'animate-ping bg-tan'
                  )}
                />
                {pendingCount > 0 && (
                  <span className="relative inline-flex size-1.5 rounded-full bg-tan" />
                )}
              </span>
              {pendingCount} pending
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-xl border border-[#2e2d29] bg-[#1e1d1a] px-3.5 py-2 text-xs font-medium text-canvas/70 transition hover:border-[#3d3b36] hover:bg-[#272622] hover:text-canvas active:scale-95 sm:text-sm"
        >
          <RefreshCw className={cn('size-4 text-canvas/50', isRefreshing && 'animate-spin')} aria-hidden />
          {board.refreshLabel}
        </button>
      </header>

      {/* Orders grid */}
      <div className="mt-6 grid max-h-[46.875rem] grid-cols-1 gap-4 overflow-y-auto pr-1 md:grid-cols-2">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            now={now}
            highlight={highlightedId === order.id}
            isDispatching={dispatchingId === order.id}
            isBusy={dispatchingId !== null || isRefreshing}
            onSendSms={onSendSms}
          />
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Floating phone-style SMS toast (bottom-right, slides in on send)    */
/* ------------------------------------------------------------------ */

export interface SmsToastData {
  phone: string
}

export function SmsToast({
  toast,
  onClose,
}: {
  toast: SmsToastData | null
  onClose: () => void
}) {
  const { toast: copy } = demoCopy
  const visible = toast !== null
  return (
    <aside
      aria-live="polite"
      aria-hidden={!visible}
      className={cn(
        'fixed bottom-6 right-6 z-50 w-[min(24rem,calc(100vw-3rem))] rounded-2xl border border-[#3e3c35] bg-[#1c1b18] p-4 text-canvas shadow-2xl transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-24 opacity-0'
      )}
    >
      {toast && (
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tan text-sm font-bold text-ink shadow">
            <span aria-hidden>💬</span>
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="truncate text-xs font-semibold text-tan">{copy.sender}</span>
              <time className="shrink-0 font-mono text-[10px] text-canvas/40">
                {copy.justNow}
              </time>
            </div>
            <p className="text-xs leading-relaxed text-canvas/85">{copy.body}</p>
            <p className="mt-2 border-t border-canvas/10 pt-1 font-mono text-[10px] text-canvas/50">
              {copy.deliveredTo} {toast.phone}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.closeLabel}
            className="p-1 text-canvas/40 transition-colors hover:text-canvas"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      )}
    </aside>
  )
}
