# Stripe Sync Fix + Mexico Shipping Fields — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Stripe-paid purchases reliably appear in the admin Orders tab, add Mexican-specific shipping fields (Colonia, Referencias) to Stripe Checkout, and add an admin reconciliation button for pulling missed payments.

**Architecture:** Extract a single idempotent service `lib/stripe-sync.ts` with `recordPaidSession(session)` that both the webhook (`/api/stripe/webhook`) and a new admin endpoint (`/api/admin/stripe-sync`) call. The service flags anomalous orders (non-MX, missing data, no stock) with `needsReview=true` instead of throwing, so customers are never charged without an order record.

**Tech Stack:** Next.js 15 App Router, Prisma 6 + PostgreSQL (Neon), Stripe Node SDK 22, NextAuth 5, Zod 4, Tailwind, framer-motion.

**Spec:** `docs/superpowers/specs/2026-05-12-stripe-webhook-mexico-fix-design.md`

---

## Note on testing

This codebase has no test framework configured (`package.json` has no `test` script). Verification is via:
- `npm run typecheck` — TypeScript compilation
- `npm run lint` — ESLint
- `npm run check` — runs both + `prisma validate`
- Manual browser testing with Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`)

Each task includes the relevant verification command.

---

## Task 0: Operational setup in Stripe Dashboard

**This is a manual task for the operator (you, the human). No code.**

- [ ] **Step 1:** Open https://dashboard.stripe.com/test/webhooks (Test mode — the URL has `/test/`).

- [ ] **Step 2:** Click **"Add endpoint"** if there's none.
  - Endpoint URL: `https://<your-vercel-prod-domain>/api/stripe/webhook`
  - Description: `0880 production webhook (test mode)`
  - Events to send: select `checkout.session.completed`
  - Click **Add endpoint**.

- [ ] **Step 3:** On the new endpoint page, click **Reveal** under "Signing secret" and copy the `whsec_...` value.

- [ ] **Step 4:** In Vercel → Project → Settings → Environment Variables, add:
  - Key: `STRIPE_WEBHOOK_SECRET`
  - Value: paste the `whsec_...` from step 3
  - Environments: Production, Preview, Development (all 3 checked)
  - Click **Save**.

- [ ] **Step 5:** Trigger a redeploy in Vercel so the new env var takes effect.

- [ ] **Step 6:** Repeat steps 1-5 for **Live mode** (https://dashboard.stripe.com/webhooks — no `/test/`) when you're ready to take real payments. Use a separate `whsec_...` (each mode has its own).

- [ ] **Step 7 (verification):** Make a test purchase. Check Stripe Dashboard → Webhooks → click your endpoint → "Recent events" — you should see a `checkout.session.completed` with a green 2xx response (after the code in this plan is deployed; before that it might show errors but events should still arrive).

---

## Task 1: Add Stripe env vars to Zod schema

**Files:**
- Modify: `lib/env.ts`

- [ ] **Step 1:** Open `lib/env.ts` and read the current `envSchema`.

- [ ] **Step 2:** Add the two Stripe entries to the schema. The schema currently ends with `RESEND_API_KEY`. Add right after it:

```ts
STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_'),
STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_'),
```

- [ ] **Step 3:** Add them to the exported `env` object at the bottom of the file:

```ts
STRIPE_SECRET_KEY: parsedEnv.data.STRIPE_SECRET_KEY,
STRIPE_WEBHOOK_SECRET: parsedEnv.data.STRIPE_WEBHOOK_SECRET,
```

- [ ] **Step 4:** Make sure your local `.env.local` has both values set (copy from Stripe Dashboard). Verify they parse correctly:

```powershell
npm run typecheck
```
Expected: no errors related to env.ts.

- [ ] **Step 5:** Commit.

```powershell
git add lib/env.ts
git commit -m "chore(env): validate Stripe keys with Zod"
```

---

## Task 2: Add Mexico/review fields to Order model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1:** Open `prisma/schema.prisma` and find `model Order`. Locate the existing block:

```prisma
shippingPostalCode String?
shippingCountry String?
status          String    @default("succeeded") // succeeded, pending, failed
```

- [ ] **Step 2:** Insert 4 new fields right after `shippingCountry String?` (before `status`):

```prisma
shippingNeighborhood String?   // Colonia (México)
shippingReferences   String?   // Entre calles / referencias
needsReview          Boolean   @default(false)
reviewReason         String?
```

The block should now look like:

```prisma
shippingPostalCode String?
shippingCountry String?
shippingNeighborhood String?
shippingReferences   String?
needsReview          Boolean   @default(false)
reviewReason         String?
status          String    @default("succeeded")
```

- [ ] **Step 3:** Validate the schema parses:

```powershell
npx prisma validate
```
Expected: `The schema at prisma/schema.prisma is valid 🚀`.

- [ ] **Step 4:** Commit (migration runs in next task).

```powershell
git add prisma/schema.prisma
git commit -m "feat(db): add Mexico shipping + review fields to Order"
```

---

## Task 3: Run Prisma migration

**Files:**
- Auto-generated: `prisma/migrations/<timestamp>_add_mexico_shipping_review/migration.sql`

- [ ] **Step 1:** Make sure `DATABASE_URL` in `.env.local` points to a dev branch (Neon makes branching easy — do not run this against prod yet).

- [ ] **Step 2:** Run the migration:

```powershell
npx prisma migrate dev --name add_mexico_shipping_review
```
Expected output: `Your database is now in sync with your schema.` and a new file under `prisma/migrations/`.

- [ ] **Step 3:** Regenerate the Prisma client (the postinstall already does this, but be explicit):

```powershell
npx prisma generate
```

- [ ] **Step 4:** Verify type check still passes:

```powershell
npm run typecheck
```
Expected: no errors.

- [ ] **Step 5:** Commit the migration file:

```powershell
git add prisma/migrations/
git commit -m "feat(db): migration for Mexico shipping + review fields"
```

---

## Task 4: Create `lib/stripe-sync.ts` service

**Files:**
- Create: `lib/stripe-sync.ts`

- [ ] **Step 1:** Create the file with the full service implementation:

```ts
// lib/stripe-sync.ts
import 'server-only'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { sendOrderConfirmation } from '@/lib/email'

export type RecordResult =
  | { status: 'created'; orderId: string }
  | { status: 'flagged'; orderId: string; reason: string }
  | { status: 'skipped'; reason: 'already_exists' | 'not_paid' | 'no_product_id' }

function extractCustomFields(session: Stripe.Checkout.Session): Record<string, string | null> {
  return (session.custom_fields ?? []).reduce((acc, f) => {
    acc[f.key] = f.text?.value ?? null
    return acc
  }, {} as Record<string, string | null>)
}

function extractShippingData(session: Stripe.Checkout.Session) {
  const shipping = (session as any).shipping_details ?? {}
  const customer = session.customer_details ?? {}
  const address = shipping.address ?? customer.address ?? {}
  const cf = extractCustomFields(session)

  return {
    customerEmail: customer.email ?? 'unknown',
    customerName: customer.name ?? shipping.name ?? null,
    customerPhone: customer.phone ?? shipping.phone ?? null,
    shippingName: shipping.name ?? customer.name ?? null,
    shippingPhone: shipping.phone ?? customer.phone ?? null,
    shippingLine1: address.line1 ?? null,
    shippingLine2: address.line2 ?? null,
    shippingCity: address.city ?? null,
    shippingState: address.state ?? null,
    shippingPostalCode: address.postal_code ?? null,
    shippingCountry: address.country ?? null,
    shippingNeighborhood: cf.colonia ?? null,
    shippingReferences: cf.referencias ?? null,
  }
}

function evaluateReview(
  shipping: ReturnType<typeof extractShippingData>,
  productStock: number,
): { needsReview: boolean; reviewReason: string | null } {
  if (shipping.shippingCountry !== 'MX') {
    return {
      needsReview: true,
      reviewReason: `País shipping: ${shipping.shippingCountry ?? 'N/A'}, esperado MX`,
    }
  }
  if (!shipping.shippingLine1) {
    return { needsReview: true, reviewReason: 'Sin dirección de envío' }
  }
  if (!shipping.shippingNeighborhood) {
    return { needsReview: true, reviewReason: 'Sin colonia' }
  }
  if (shipping.customerEmail === 'unknown') {
    return { needsReview: true, reviewReason: 'Sin email de cliente' }
  }
  if (productStock <= 0) {
    return { needsReview: true, reviewReason: 'Sin stock al cobrar' }
  }
  return { needsReview: false, reviewReason: null }
}

export async function recordPaidSession(
  session: Stripe.Checkout.Session,
): Promise<RecordResult> {
  // 1. Idempotency
  const existing = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
  })
  if (existing) {
    return { status: 'skipped', reason: 'already_exists' }
  }

  // 2. Must be paid
  if (session.payment_status !== 'paid') {
    return { status: 'skipped', reason: 'not_paid' }
  }

  // 3. Product ID required
  const productId = parseInt(session.metadata?.productId ?? '0', 10)
  if (!productId || productId <= 0) {
    logger.warn(`[stripe-sync] session ${session.id} has no valid productId in metadata`)
    return { status: 'skipped', reason: 'no_product_id' }
  }

  // 4. Load product
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) {
    logger.warn(`[stripe-sync] session ${session.id} references unknown productId ${productId}`)
    return { status: 'skipped', reason: 'no_product_id' }
  }

  // 5. Extract shipping data + custom fields
  const shipping = extractShippingData(session)

  // 6. Decide if needs review
  const { needsReview, reviewReason } = evaluateReview(shipping, product.stock)

  // 7. Create order (and optionally decrement stock) in a transaction
  try {
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          productId,
          total: Math.round((session.amount_total ?? 0) / 100),
          ...shipping,
          stripeSessionId: session.id,
          status: 'succeeded',
          needsReview,
          reviewReason,
        },
      })

      if (!needsReview) {
        await tx.inventoryMovement.create({
          data: {
            productId,
            type: 'SALE',
            quantity: 1,
            reason: `Venta Stripe: ${session.id}`,
          },
        })
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: 1 } },
        })
      }

      return created
    })

    // 8. Email (non-blocking, only for non-review orders)
    if (!needsReview) {
      Promise.resolve().then(async () => {
        try {
          await sendOrderConfirmation({
            customerEmail: shipping.customerEmail,
            productName: product.name,
            productImage: product.image,
            productCollection: product.collection,
            total: Math.round((session.amount_total ?? 0) / 100),
            stripeSessionId: session.id,
          })
        } catch (err: any) {
          logger.error(`[stripe-sync] email send failed for ${session.id}: ${err.message}`)
        }
      })
    }

    logger.info(
      `[stripe-sync] session ${session.id} → order ${order.id}` +
        (needsReview ? ` (REVIEW: ${reviewReason})` : ''),
    )
    return needsReview
      ? { status: 'flagged', orderId: order.id, reason: reviewReason! }
      : { status: 'created', orderId: order.id }
  } catch (err: any) {
    // P2002 = unique constraint failure — race condition with concurrent webhook retry
    if (err.code === 'P2002') {
      logger.info(`[stripe-sync] session ${session.id} race detected, treating as already_exists`)
      return { status: 'skipped', reason: 'already_exists' }
    }
    logger.error(`[stripe-sync] DB error for session ${session.id}: ${err.message}`)
    throw err
  }
}
```

- [ ] **Step 2:** Verify type check passes:

```powershell
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3:** Lint:

```powershell
npm run lint
```
Expected: no errors in `lib/stripe-sync.ts`.

- [ ] **Step 4:** Commit.

```powershell
git add lib/stripe-sync.ts
git commit -m "feat(stripe): extract recordPaidSession service"
```

---

## Task 5: Refactor webhook to use the service

**Files:**
- Modify: `app/api/stripe/webhook/route.ts`

- [ ] **Step 1:** Replace the entire file with this leaner version:

```ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';
import { recordPaidSession } from '@/lib/stripe-sync';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    logger.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET no está configurado');
    return NextResponse.json({ error: 'Webhook no configurado' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    logger.error(`[stripe-webhook] signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      const result = await recordPaidSession(session);
      logger.info(`[stripe-webhook] ${event.id}: ${JSON.stringify(result)}`);
    } catch (err: any) {
      // Only DB-irrecoverable errors bubble. Let Stripe retry.
      logger.error(`[stripe-webhook] ${event.id} failed: ${err.message}`);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  } else {
    logger.info(`[stripe-webhook] unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
```

Key changes from the previous version:
- Removed `addressFromSession` (moved into service).
- Removed the `throw new Error('La dirección de envío debe estar en México')` — now the service flags the order instead.
- Removed `export const config = { api: { bodyParser: false } }` (Pages Router relic, no effect in App Router).
- All logging prefixed `[stripe-webhook]`.

- [ ] **Step 2:** Type check:

```powershell
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3:** Commit.

```powershell
git add app/api/stripe/webhook/route.ts
git commit -m "refactor(stripe): delegate webhook to stripe-sync service"
```

---

## Task 6: Add `custom_fields` to Stripe Checkout

**Files:**
- Modify: `app/api/stripe/checkout/route.ts`

- [ ] **Step 1:** Open `app/api/stripe/checkout/route.ts`. Find the call to `stripe.checkout.sessions.create({...})` (around line 34).

- [ ] **Step 2:** Add `locale` and `custom_fields` properties. Insert them right after the closing brace of `shipping_address_collection`:

```ts
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  billing_address_collection: 'required',
  phone_number_collection: { enabled: true },
  shipping_address_collection: {
    allowed_countries: ['MX'],
  },
  locale: 'es-419',
  custom_fields: [
    {
      key: 'colonia',
      label: { type: 'custom', custom: 'Colonia' },
      type: 'text',
      optional: false,
      text: { minimum_length: 2, maximum_length: 80 },
    },
    {
      key: 'referencias',
      label: { type: 'custom', custom: 'Referencias / Entre calles (opcional)' },
      type: 'text',
      optional: true,
      text: { maximum_length: 200 },
    },
  ],
  line_items: [
    /* ... unchanged ... */
  ],
  // ... rest unchanged ...
});
```

- [ ] **Step 3:** Type check:

```powershell
npm run typecheck
```
Expected: no errors.

- [ ] **Step 4:** Commit.

```powershell
git add app/api/stripe/checkout/route.ts
git commit -m "feat(checkout): collect Colonia and Referencias for Mexico"
```

---

## Task 7: Create admin reconciliation endpoint

**Files:**
- Create: `app/api/admin/stripe-sync/route.ts`

- [ ] **Step 1:** Create the file:

```ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/auth'
import { recordPaidSession, type RecordResult } from '@/lib/stripe-sync'
import { logger } from '@/lib/logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

async function ensureAdmin() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
}

export async function POST() {
  try {
    await ensureAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const since = Math.floor(Date.now() / 1000) - 30 * 24 * 3600 // 30 días

  let sessions
  try {
    sessions = await stripe.checkout.sessions.list({
      created: { gte: since },
      limit: 100,
    })
  } catch (err: any) {
    logger.error(`[stripe-sync-admin] Stripe list failed: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 502 })
  }

  const results: RecordResult[] = []
  for (const s of sessions.data) {
    if (s.payment_status !== 'paid') continue
    try {
      // Re-fetch with custom_fields expansion (list endpoint doesn't include them).
      const full = await stripe.checkout.sessions.retrieve(s.id)
      results.push(await recordPaidSession(full))
    } catch (err: any) {
      logger.error(`[stripe-sync-admin] failed to process ${s.id}: ${err.message}`)
    }
  }

  const summary = {
    total: results.length,
    created: results.filter((r) => r.status === 'created').length,
    flagged: results.filter((r) => r.status === 'flagged').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
  }
  logger.info(`[stripe-sync-admin] result ${JSON.stringify(summary)}`)
  return NextResponse.json(summary)
}
```

- [ ] **Step 2:** Type check:

```powershell
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3:** Commit.

```powershell
git add app/api/admin/stripe-sync/route.ts
git commit -m "feat(admin): endpoint to reconcile paid Stripe sessions"
```

---

## Task 8: Add `reviewOnly` filter to `getOrders`

**Files:**
- Modify: `lib/server-actions.ts:505-520`

- [ ] **Step 1:** Open `lib/server-actions.ts` and find the `getOrders` function (currently around line 505):

```ts
export async function getOrders(filters?: { search?: string; status?: string }) {
  await ensureAdmin()
  try {
    return await prisma.order.findMany({
      where: {
        ...(filters?.search ? { customerEmail: { contains: filters.search, mode: 'insensitive' } } : {}),
        ...(filters?.status && filters.status !== 'all' ? { shippingStatus: filters.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { name: true, image: true, collection: true } } },
      take: 100,
    })
  } catch (error) {
    throw new Error('Error fetching orders')
  }
}
```

- [ ] **Step 2:** Replace with:

```ts
export async function getOrders(filters?: { search?: string; status?: string; reviewOnly?: boolean }) {
  await ensureAdmin()
  try {
    return await prisma.order.findMany({
      where: {
        ...(filters?.search ? { customerEmail: { contains: filters.search, mode: 'insensitive' } } : {}),
        ...(filters?.status && filters.status !== 'all' ? { shippingStatus: filters.status } : {}),
        ...(filters?.reviewOnly ? { needsReview: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { name: true, image: true, collection: true } } },
      take: 100,
    })
  } catch (error) {
    throw new Error('Error fetching orders')
  }
}
```

- [ ] **Step 3:** Type check:

```powershell
npm run typecheck
```
Expected: no errors.

- [ ] **Step 4:** Commit.

```powershell
git add lib/server-actions.ts
git commit -m "feat(orders): add reviewOnly filter"
```

---

## Task 9: Add Sync button + "Revisar" filter chip to OrdersTab

**Files:**
- Modify: `components/admin/OrdersTab.jsx`

- [ ] **Step 1:** Open `components/admin/OrdersTab.jsx`. Add `RefreshCw` and `AlertTriangle` to the lucide imports at line 5:

Replace:
```jsx
import { Search, X, Package, Truck, CheckCircle, Clock, ChevronDown, MapPin, Phone } from 'lucide-react'
```
With:
```jsx
import { Search, X, Package, Truck, CheckCircle, Clock, ChevronDown, MapPin, Phone, RefreshCw, AlertTriangle } from 'lucide-react'
```

- [ ] **Step 2:** In `OrdersTab` (the default export function, around line 204), add state and a `reviewOnly` filter chip. Insert after the line `const [selectedOrder, setSelectedOrder] = useState(null)`:

```jsx
const [reviewOnly, setReviewOnly] = useState(false)
const [isSyncing, setIsSyncing] = useState(false)

const handleSync = async () => {
  setIsSyncing(true)
  try {
    const res = await fetch('/api/admin/stripe-sync', { method: 'POST' })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    toast.success(
      `${data.created} creadas, ${data.flagged} para revisar, ${data.skipped} ya existentes`
    )
    await loadOrders()
  } catch (err) {
    toast.error('Error al sincronizar con Stripe')
  } finally {
    setIsSyncing(false)
  }
}
```

- [ ] **Step 3:** Update `loadOrders` to pass `reviewOnly`. Find:

```jsx
const data = await getOrders({ search: search || undefined, status: statusFilter })
```
Replace with:
```jsx
const data = await getOrders({ search: search || undefined, status: statusFilter, reviewOnly })
```

- [ ] **Step 4:** Update the `useEffect` that calls `loadOrders` to include `reviewOnly`:

```jsx
useEffect(() => { loadOrders() }, [search, statusFilter, reviewOnly])
```

- [ ] **Step 5:** Add the Sync button to the header. Find the block (around line 232):

```jsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
    <h2 className="font-serif text-2xl text-stone-800">Pedidos</h2>
    <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">{orders.length} pedido{orders.length !== 1 ? 's' : ''}</p>
  </div>
</div>
```
Replace with:
```jsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
    <h2 className="font-serif text-2xl text-stone-800">Pedidos</h2>
    <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">{orders.length} pedido{orders.length !== 1 ? 's' : ''}</p>
  </div>
  <button
    onClick={handleSync}
    disabled={isSyncing}
    className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold border border-stone-300 px-3 py-2 rounded-lg hover:bg-stone-50 disabled:opacity-50"
  >
    <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
    {isSyncing ? 'Sincronizando…' : 'Sincronizar Stripe'}
  </button>
</div>
```

- [ ] **Step 6:** Add the "Revisar" chip. Find the chip list (`SHIPPING_STATUSES.map(...)`, around line 252) and add right after it (inside the same `<div className="flex gap-2 flex-wrap">`):

```jsx
<button
  onClick={() => setReviewOnly(!reviewOnly)}
  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all inline-flex items-center gap-1 ${
    reviewOnly
      ? 'bg-amber-100 text-amber-800 border border-amber-200'
      : 'bg-white border border-stone-300 text-stone-600 hover:border-amber-300'
  }`}
>
  <AlertTriangle size={11} />
  Revisar
</button>
```

- [ ] **Step 7:** Type check + lint:

```powershell
npm run check
```
Expected: no errors.

- [ ] **Step 8:** Commit.

```powershell
git add components/admin/OrdersTab.jsx
git commit -m "feat(admin): Stripe sync button and review filter chip"
```

---

## Task 10: Highlight `needsReview` rows + add badge in OrdersTab table

**Files:**
- Modify: `components/admin/OrdersTab.jsx`

- [ ] **Step 1:** Find the `<tr>` for each order (inside `orders.map(order => ...)`, around line 296):

```jsx
<tr key={order.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
```
Replace with:
```jsx
<tr
  key={order.id}
  className={`border-b border-stone-50 hover:bg-stone-50/50 transition-colors ${
    order.needsReview ? 'bg-amber-50/50' : ''
  }`}
>
```

- [ ] **Step 2:** Add a review badge inside the "Pedido" `<td>` cell. Find:

```jsx
<td className="px-4 py-3">
  <span className="font-mono text-[10px] text-stone-500">#{order.stripeSessionId.slice(-8).toUpperCase()}</span>
</td>
```
Replace with:
```jsx
<td className="px-4 py-3">
  <div className="flex items-center gap-2">
    <span className="font-mono text-[10px] text-stone-500">#{order.stripeSessionId.slice(-8).toUpperCase()}</span>
    {order.needsReview && (
      <span
        title={order.reviewReason || 'Requiere revisión'}
        className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest"
      >
        <AlertTriangle size={9} />
        Revisar
      </span>
    )}
  </div>
</td>
```

- [ ] **Step 3:** Type check + lint:

```powershell
npm run check
```
Expected: no errors.

- [ ] **Step 4:** Commit.

```powershell
git add components/admin/OrdersTab.jsx
git commit -m "feat(admin): highlight orders that need review"
```

---

## Task 11: Show Colonia, Referencias, and review reason in OrderDetailModal

**Files:**
- Modify: `components/admin/OrdersTab.jsx`

- [ ] **Step 1:** Update the `formatAddress` function (around line 43) to include the new fields:

```jsx
function formatAddress(order) {
  return [
    order.shippingLine1,
    order.shippingLine2,
    order.shippingNeighborhood ? `Col. ${order.shippingNeighborhood}` : null,
    [order.shippingPostalCode, order.shippingCity, order.shippingState].filter(Boolean).join(' '),
    order.shippingCountry === 'MX' ? 'México' : order.shippingCountry,
  ].filter(Boolean)
}
```

- [ ] **Step 2:** Inside `OrderDetailModal`, add the review banner at the very top of the content area. Find the line:

```jsx
<div className="p-6 space-y-5">
  {/* Product */}
```
Replace with:
```jsx
<div className="p-6 space-y-5">
  {order.needsReview && (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
      <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800">Requiere revisión</p>
        <p className="text-xs text-amber-900 mt-0.5">{order.reviewReason || 'Sin razón registrada'}</p>
      </div>
    </div>
  )}
  {/* Product */}
```

- [ ] **Step 3:** Find the shipping address block in the modal (around line 130) and add Referencias underneath. Find:

```jsx
{/* Shipping address */}
<div>
  <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Dirección de Envío</p>
  {formatAddress(order).length > 0 ? (
    <div className="text-sm text-stone-700 leading-relaxed">
      {order.shippingName && order.shippingName !== order.customerName && (
        <p className="font-medium text-stone-800">{order.shippingName}</p>
      )}
      {formatAddress(order).map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </div>
  ) : (
    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
      Sin dirección registrada. Verifica que el pedido se haya creado con la nueva configuración de Stripe.
    </p>
  )}
</div>
```

Replace with:

```jsx
{/* Shipping address */}
<div>
  <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Dirección de Envío</p>
  {formatAddress(order).length > 0 ? (
    <div className="text-sm text-stone-700 leading-relaxed">
      {order.shippingName && order.shippingName !== order.customerName && (
        <p className="font-medium text-stone-800">{order.shippingName}</p>
      )}
      {formatAddress(order).map((line, index) => (
        <p key={index}>{line}</p>
      ))}
      {order.shippingReferences && (
        <p className="text-xs text-stone-500 italic mt-2">
          Referencias: {order.shippingReferences}
        </p>
      )}
    </div>
  ) : (
    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
      Sin dirección registrada. Verifica que el pedido se haya creado con la nueva configuración de Stripe.
    </p>
  )}
</div>
```

- [ ] **Step 4:** Type check + lint:

```powershell
npm run check
```
Expected: no errors.

- [ ] **Step 5:** Commit.

```powershell
git add components/admin/OrdersTab.jsx
git commit -m "feat(admin): show Colonia, Referencias, and review reason in order modal"
```

---

## Task 12: Manual end-to-end verification

**Files:** none modified.

This task validates the whole flow works end-to-end with real Stripe traffic in test mode.

- [ ] **Step 1:** Start the dev server in one terminal:

```powershell
npm run dev
```
Expected: server up on `http://localhost:3000`.

- [ ] **Step 2:** In a second terminal, start Stripe webhook forwarding:

```powershell
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Expected output: `Ready! Your webhook signing secret is whsec_...`. Copy that `whsec_` value.

- [ ] **Step 3:** Update `.env.local` with that local webhook secret (it is different from the Vercel one):

```env
STRIPE_WEBHOOK_SECRET=whsec_<value-from-step-2>
```
Restart `npm run dev` to pick up the change.

- [ ] **Step 4:** **Happy path test.** Open `http://localhost:3000` → choose a product → click "Comprar". On the Stripe Checkout page:
  - Email: anything
  - Card: `4242 4242 4242 4242`, exp `12/30`, CVC `123`
  - Name: anything
  - Country: must be `México`
  - Address: complete all fields
  - **Colonia**: e.g. `Centro` (verify the custom field is rendered)
  - **Referencias**: leave blank or fill freely
  - Click Pay.

Expected: redirect to `/checkout/success`. In the `stripe listen` terminal, see `checkout.session.completed` with `2xx`. In the `npm run dev` terminal, see `[stripe-webhook] evt_... {"status":"created","orderId":"..."}`.

- [ ] **Step 5:** Open `http://localhost:3000/admin` → Pedidos. The order should appear at the top with:
  - Full address including `Col. Centro`
  - No "Revisar" badge
  - Status: pending shipping

- [ ] **Step 6:** **Reconciliation test.** Open the admin Pedidos tab → click "Sincronizar Stripe". Toast should say `0 creadas, 0 para revisar, N ya existentes` (where N is the count of recent paid sessions). This proves idempotency.

- [ ] **Step 7:** **Recovery test.** Manually delete the test order via Prisma Studio:

```powershell
npx prisma studio
```
In Prisma Studio, delete the order row. Refresh the admin Pedidos tab → it disappears. Then click "Sincronizar Stripe" → toast shows `1 creada, 0 para revisar, N-1 ya existentes`. Refresh → order is back.

- [ ] **Step 8:** **needsReview test (stock race).** Stock 0 can only happen via a race because `app/api/stripe/checkout/route.ts` blocks session creation when `stock <= 0`. To simulate: pick a product with `stock = 1`, click Comprar (this creates the session), then **before paying**, open Prisma Studio in another tab and set that product's `stock` to `0`. Finish paying on the Stripe page. After the webhook fires, the new order should appear in admin with:
  - Row highlighted in amber.
  - Badge "REVISAR" next to the order ID.
  - Click "Gestionar" → modal shows yellow banner "Requiere revisión — Sin stock al cobrar".
  - In Prisma Studio: product's `stock` stays at `0`, no `InventoryMovement` row of type `SALE` for this order.

  **Alternative without race:** temporarily comment out the `stock <= 0` check in `app/api/stripe/checkout/route.ts` lines 21-24, restart `npm run dev`, set product stock to 0, make a checkout, observe the flag. Restore the check after testing.

- [ ] **Step 9:** **Review filter test.** Click the "⚠ Revisar" chip in the filters. Only the flagged order should remain visible. Click it again to clear.

- [ ] **Step 10:** **Done — commit the docs.** Update any markdown referencing the old behavior if needed (not strictly required). Otherwise no commit needed for this verification task.

---

## Self-review checklist

After implementing all tasks, before declaring done:

- [ ] Run `npm run check` — passes with no errors.
- [ ] Make a test purchase and confirm the order shows up in admin without manual intervention.
- [ ] Click "Sincronizar Stripe" twice in a row — second time should show all as `skipped`.
- [ ] Confirm Stripe Dashboard → Webhooks → your endpoint → recent events are all green 2xx.
- [ ] Confirm `lib/env.ts` rejects the build if `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` is missing — test by temporarily commenting one out in `.env.local` (then restore).
- [ ] Re-read the spec at `docs/superpowers/specs/2026-05-12-stripe-webhook-mexico-fix-design.md` — every "Modificado" / "Nuevo" file in the spec's Components section is touched by a task. (Verified at plan-write time: env.ts, schema.prisma, stripe-sync.ts, webhook route, checkout route, admin sync route, server-actions.ts, OrdersTab.jsx — all covered.)
