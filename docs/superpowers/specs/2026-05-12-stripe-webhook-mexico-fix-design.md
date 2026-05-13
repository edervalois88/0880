# Spec: Reflejo de compras Stripe en admin + datos de envío para México

**Fecha:** 2026-05-12
**Autor:** Brainstorming con Claude
**Estado:** Diseño aprobado, listo para plan de implementación

## Contexto y problema

El sitio 0880 (e-commerce de bordados/lujo hecho a mano en León, Gto.) usa Stripe Checkout para cobrar y un webhook `/api/stripe/webhook` para registrar las órdenes en la base de datos (Postgres/Neon via Prisma) y decrementar inventario.

**Síntomas reportados:**
- Las compras completadas en Stripe (modo test) no aparecen en la pestaña de Pedidos del admin.
- El operador necesita confirmar que sólo se acepten compras de México.
- El operador necesita capturar todos los datos requeridos para hacer un envío en México (Stripe no recolecta Colonia por defecto).

**Causa raíz confirmada durante el diagnóstico:**
El endpoint webhook **no está dado de alta** en Stripe Dashboard (Test mode → Webhooks: la lista está vacía). Stripe no sabe a dónde enviar los eventos `checkout.session.completed`, así que el código del webhook nunca se ejecuta y las órdenes nunca se crean. La página `/checkout/success` se muestra de todos modos porque depende del flujo del navegador (redirect de Stripe), no del webhook.

**Problemas secundarios encontrados al revisar el código:**
1. El webhook tira `throw new Error('La dirección de envío debe estar en México')` si el país no es MX. Si llegara a colarse un pago no-MX, el cliente queda cobrado pero sin orden.
2. `export const config = { api: { bodyParser: false } }` al final del archivo es sintaxis del Pages Router; en App Router no tiene efecto. Código muerto.
3. No hay forma de recuperar pagos cuyo webhook haya fallado — no existe endpoint de reconciliación con Stripe.
4. El schema `Order` no tiene campos para Colonia ni referencias de entrega — datos críticos para paqueterías mexicanas.

## Objetivos

- **O1.** Las compras pagadas en Stripe siempre se reflejan como `Order` en el admin (vía webhook).
- **O2.** Si el webhook falla o nunca llegó un evento, el admin puede recuperar los pagos manualmente con un botón "Sincronizar Stripe".
- **O3.** Stripe Checkout recolecta Colonia (obligatoria) y Referencias (opcional) para envíos en México.
- **O4.** Sólo se aceptan compras con dirección de envío en México; pagos fronterizos quedan registrados pero marcados para revisión, nunca tirados.
- **O5.** El admin puede ver claramente qué órdenes requieren revisión y por qué.

**Fuera de alcance** (sub-proyectos futuros): carrito multi-producto, costo de envío, IVA, tabla `WebhookEvent`, refunds/disputes, portal de cliente, exportar CSV/packing slip.

## Arquitectura

```
                    ┌──────────────────────────────┐
                    │  Stripe Checkout (hospedado) │
                    │  - allowed_countries: ['MX'] │
                    │  - custom_fields: Colonia,   │
                    │    Referencias               │
                    └───────────┬──────────────────┘
                                │ checkout.session.completed
                                ▼
                ┌───────────────────────────────────┐
                │  app/api/stripe/webhook/route.ts  │  ◄── Stripe firma con whsec_
                └───────────────┬───────────────────┘
                                │ delega a
                                ▼
              ┌─────────────────────────────────────┐
              │  lib/stripe-sync.ts                 │
              │  recordPaidSession(session)         │ ◄── idempotente, llamado
              │  - validar país MX                  │     por webhook Y sync
              │  - upsert Order por stripeSessionId │
              │  - decrement stock                  │
              │  - emit InventoryMovement           │
              │  - send email (non-blocking)        │
              └─────────────────────────────────────┘
                                ▲
                                │ también llamado por
                ┌───────────────┴─────────────────────┐
                │  app/api/admin/stripe-sync/route.ts │  ◄── POST desde admin
                │  - list sessions(paid, last 30d)    │
                │  - call recordPaidSession() c/u     │
                │  - return { synced, skipped }       │
                └─────────────────────────────────────┘
```

**Principio clave:** una sola función `recordPaidSession()` es responsable de convertir una sesión Stripe pagada en una Order de la base. Webhook y sync manual ambos la invocan, así no hay riesgo de divergencia.

## Componentes

### `lib/stripe-sync.ts` (nuevo)

Servicio puro (sin Next, sin Auth) que expone:

```ts
export type RecordResult =
  | { status: 'created'; orderId: string }
  | { status: 'skipped'; reason: 'already_exists' | 'not_paid' | 'no_product_id' }
  | { status: 'flagged'; orderId: string; reason: string }  // needsReview

export async function recordPaidSession(
  session: Stripe.Checkout.Session
): Promise<RecordResult>
```

**Lógica de `recordPaidSession`:**

1. Idempotencia: si ya existe `Order` con `stripeSessionId === session.id`, retorna `{ status: 'skipped', reason: 'already_exists' }`.
2. Si `session.payment_status !== 'paid'`, retorna `{ status: 'skipped', reason: 'not_paid' }`.
3. Parsear `productId` desde `session.metadata.productId`. Si no es entero válido > 0, retorna `{ status: 'skipped', reason: 'no_product_id' }` con un `logger.warn`.
4. Extraer datos de envío y custom_fields de la sesión:
   ```ts
   const shipping = session.shipping_details ?? {}
   const customer = session.customer_details ?? {}
   const address = shipping.address ?? customer.address ?? {}
   const cf = (session.custom_fields ?? []).reduce((acc, f) => {
     acc[f.key] = f.text?.value ?? null
     return acc
   }, {} as Record<string, string | null>)
   ```
5. Determinar `needsReview` y `reviewReason`:
   - Si `address.country !== 'MX'` → `reviewReason = "País shipping: ${address.country ?? 'N/A'}, esperado MX"`
   - Si no hay `address.line1` → `reviewReason = "Sin dirección"`
   - Si no hay `customer.email` → `reviewReason = "Sin email de cliente"`
6. Cargar producto. Si `product.stock <= 0`, fijar `needsReview = true`, `reviewReason = "Sin stock al cobrar"`.
7. Transacción Prisma:
   - `Order.create({ ...campos, needsReview, reviewReason })`
   - **Sólo si `needsReview === false`**: `InventoryMovement.create({ type: 'SALE', quantity: 1 })` + `Product.update({ stock: { decrement: 1 } })`. Cualquier orden marcada para revisión queda fuera del flujo de inventario automático para que el admin decida (procesar manualmente, reembolsar, etc.) sin que el stock quede inconsistente.
   - Si `Order.create` falla con P2002 (`stripeSessionId` duplicado por reintento de Stripe), envolver en try/catch y retornar `{ status: 'skipped', reason: 'already_exists' }`.
8. Enviar email de confirmación con `Promise.resolve().then(...)` (non-blocking). Sólo si `needsReview === false` — órdenes en revisión no disparan email al cliente hasta que el admin las apruebe.
9. Retornar `{ status: 'created' | 'flagged' | 'skipped', orderId?, reason? }`.

**El servicio no tira excepciones por errores de negocio** (país, datos faltantes, race de unique) — sólo por errores de DB irrecuperables. Eso permite que Stripe vea siempre 200.

### `app/api/stripe/webhook/route.ts` (modificado)

```ts
import { recordPaidSession } from '@/lib/stripe-sync'

export async function POST(req: NextRequest) {
  // Verificar firma (igual que ahora)
  // Si event.type === 'checkout.session.completed':
  const result = await recordPaidSession(event.data.object)
  logger.info(`[stripe-webhook] ${event.id}: ${JSON.stringify(result)}`)
  return NextResponse.json({ received: true })
}
```

**Eliminar:** el bloque `if (shippingData.shippingCountry !== 'MX') throw ...`, todo el código de creación de Order/inventory/email duplicado (ahora vive en el servicio), y `export const config = { api: { bodyParser: false } }`.

### `app/api/admin/stripe-sync/route.ts` (nuevo)

```ts
export async function POST() {
  await ensureAdmin()
  const since = Math.floor(Date.now() / 1000) - 30 * 24 * 3600
  const sessions = await stripe.checkout.sessions.list({
    created: { gte: since },
    limit: 100,
  })

  const results: RecordResult[] = []
  for (const s of sessions.data) {
    if (s.payment_status === 'paid') {
      // Re-fetch con expand para tener custom_fields completos
      const full = await stripe.checkout.sessions.retrieve(s.id, {
        expand: ['customer_details', 'shipping_details'],
      })
      results.push(await recordPaidSession(full))
    }
  }

  return NextResponse.json({
    total: results.length,
    created: results.filter(r => r.status === 'created').length,
    flagged: results.filter(r => r.status === 'flagged').length,
    skipped: results.filter(r => r.status === 'skipped').length,
  })
}
```

### `app/api/stripe/checkout/route.ts` (modificado)

Agregar a `stripe.checkout.sessions.create({...})`:

```ts
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
```

### `prisma/schema.prisma` (modificado)

Agregar a `model Order`:

```prisma
shippingNeighborhood String?
shippingReferences   String?
needsReview          Boolean   @default(false)
reviewReason         String?
```

Migración: `npx prisma migrate dev --name add_mexico_shipping_review`. Los 4 campos son opcionales o con default — compatible con órdenes existentes.

### `lib/server-actions.ts` (modificado)

Función `getOrders()` ya devuelve la Order completa, así que los nuevos campos pasan al frontend automáticamente. Sólo agregar opción de filtro `reviewOnly?: boolean`:

```ts
export async function getOrders(filters?: { search?: string; status?: string; reviewOnly?: boolean }) {
  // ... + (filters?.reviewOnly ? { needsReview: true } : {})
}
```

### `lib/env.ts` (modificado)

Agregar al schema de Zod (actualmente faltan y se usan con `!` en checkout y webhook):

```ts
STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
```

### `components/admin/OrdersTab.jsx` (modificado)

1. **Botón "Sincronizar Stripe"** en el header del tab. Llama `POST /api/admin/stripe-sync`, muestra toast con resumen `"${created} creadas, ${flagged} para revisar, ${skipped} ya existentes"`, recarga lista.
2. **Filtro "⚠ Revisar"** como chip extra en la barra de status filters.
3. **Fila resaltada** (`bg-amber-50`) cuando `order.needsReview === true`.
4. **Badge "⚠ REVISAR"** en la columna de status con tooltip mostrando `reviewReason`.
5. **Modal de detalle**: bloque amarillo arriba con `reviewReason` cuando `needsReview`; sección de dirección actualizada para mostrar Colonia y Referencias:
   ```jsx
   <p>{order.shippingLine1}</p>
   {order.shippingLine2 && <p>{order.shippingLine2}</p>}
   {order.shippingNeighborhood && <p>Col. {order.shippingNeighborhood}</p>}
   <p>{order.shippingPostalCode} {order.shippingCity}, {order.shippingState}</p>
   <p>México</p>
   {order.shippingReferences && <p className="italic text-stone-500 mt-2">Referencias: {order.shippingReferences}</p>}
   ```

## Data flow

**Compra normal (webhook funciona):**
1. Cliente hace clic "Comprar" → POST `/api/stripe/checkout` → recibe URL de Stripe.
2. Cliente paga en `checkout.stripe.com` con tarjeta + datos shipping + Colonia (custom field).
3. Stripe redirige a `/checkout/success`.
4. Stripe envía `POST /api/stripe/webhook` con evento `checkout.session.completed`.
5. Webhook verifica firma, llama `recordPaidSession(session)`.
6. Servicio crea Order, decrementa stock, envía email.
7. Admin la ve en su Orders tab al refrescar.

**Compra que pierde el webhook:**
1-3. Igual.
4. Stripe envía evento pero falla (red, timeout, secret inválido) y reintenta 3 veces antes de dejar de intentar.
5. La Order no existe en DB.
6. Admin entra a Pedidos, hace clic "Sincronizar Stripe".
7. Endpoint jala últimas 100 sesiones pagadas de 30 días.
8. Para cada una, llama `recordPaidSession` — las nuevas crean Order, las existentes regresan `skipped: already_exists`.
9. Toast: "1 creada, 0 para revisar, 47 ya existentes".

**Compra que se cuela con país no-MX** (en teoría imposible con `allowed_countries: ['MX']`, pero el servicio lo cubre por defensa):
1-5. Igual.
6. Servicio detecta `address.country !== 'MX'`, crea Order con `needsReview=true`, `reviewReason="País shipping: US, esperado MX"`.
7. Admin la ve resaltada en amarillo, decide reembolsar vía Stripe Dashboard o procesar manualmente.

## Manejo de errores

| Caso | Comportamiento |
|------|---------------|
| Webhook no dado de alta en Stripe | README documenta paso a paso; admin tiene Sync para backfill. |
| `STRIPE_WEBHOOK_SECRET` incorrecto | Endpoint regresa 400 (`logger.error` con prefijo `[stripe-webhook]`). Stripe reintenta. Admin puede usar Sync como contingencia. |
| País shipping ≠ MX | Order creada con `needsReview=true`. Cliente no se queda cobrado sin orden. |
| Sin `productId` en metadata | `logger.warn`, `skipped`. Cliente sigue siendo visible en Stripe pero sin Order — caso raro que requiere inspección manual del Dashboard. |
| DB falla en transacción | Servicio re-tira; webhook regresa 500 a Stripe; Stripe reintenta hasta 3 veces. La constraint `stripeSessionId @unique` evita duplicado en reintentos exitosos. |
| Sync corre 2 veces | Idempotencia por `stripeSessionId` — segunda corrida regresa `skipped: already_exists` para todas las ya procesadas. |
| Stock 0 al momento del cobro | Order creada con `needsReview=true`, `reviewReason="Sin stock al cobrar"`. NO decrementa stock. Admin decide si reembolsar o producir otra pieza. |

**Logging:** todo usa `logger` con prefijo `[stripe-sync]` o `[stripe-webhook]` para filtrar fácilmente en Vercel logs.

## Testing

No hay framework de tests configurado en el repo, así que se validará manualmente:

1. **Webhook local con Stripe CLI**
   - Correr `stripe listen --forward-to localhost:3000/api/stripe/webhook` en otra terminal.
   - Hacer compra test → verificar que la Order aparece en admin con todos los campos.
2. **Webhook en Vercel preview**
   - Dar de alta el endpoint en Stripe Dashboard (test mode) apuntando al URL del preview.
   - Hacer compra test → verificar Order en admin.
3. **Botón Sync recupera órdenes perdidas**
   - Borrar manualmente una Order de DB.
   - Click "Sincronizar Stripe" → verificar que se recrea con todos los datos.
4. **Idempotencia**
   - Click Sync 2 veces seguidas → segunda corrida muestra 0 created, todas skipped.
5. **`needsReview` por stock 0**
   - Poner stock = 0 manualmente en DB.
   - Forzar webhook con `stripe trigger checkout.session.completed`.
   - Verificar Order creada con badge "REVISAR", stock no decrementado.
6. **Custom fields**
   - Completar Colonia y Referencias en checkout.
   - Verificar que aparecen correctamente en el modal del admin.
7. **Filtro Revisar**
   - Marcar manualmente alguna Order con `needsReview=true`.
   - Activar chip "⚠ Revisar" → sólo muestra esas filas.

## Tareas operativas (no de código)

Antes de que el código resuelva el problema reportado, hay que:

1. **Dar de alta el webhook en Stripe Dashboard** (Test mode):
   - https://dashboard.stripe.com/test/webhooks → Add endpoint
   - URL: `https://<dominio-vercel-prod>/api/stripe/webhook`
   - Eventos: `checkout.session.completed`
   - Copiar el "Signing secret" (`whsec_...`)
2. **Guardar el secret en Vercel**:
   - Settings → Environment Variables → `STRIPE_WEBHOOK_SECRET` = `whsec_...`
   - Redeploy para que tome efecto.
3. **Repetir el alta para Live mode** cuando vaya a producción real (`https://dashboard.stripe.com/webhooks`).
4. **Actualizar `lib/env.ts`** para agregar `STRIPE_WEBHOOK_SECRET` y `STRIPE_SECRET_KEY` al schema de Zod — actualmente faltan y el código las usa con `!`.

## Riesgos y mitigaciones

- **Riesgo:** Stripe cambia el shape de `session.custom_fields` en versiones futuras de la API.
  **Mitigación:** El servicio tiene un reducer defensivo (`?? null`) y un test manual cada vez que se actualice `apiVersion`.
- **Riesgo:** El endpoint `/api/admin/stripe-sync` corre lento si hay mucho histórico.
  **Mitigación:** Limitar a `limit: 100, created.gte: 30 días`. Si crece más, paginar.
- **Riesgo:** Stripe reintenta el webhook mientras `recordPaidSession` ya está creando la Order — race condition en `Order.create`.
  **Mitigación:** El `stripeSessionId @unique` constraint causa que el segundo `create` falle con P2002; envolver en try/catch y tratarlo como `skipped: already_exists`.
