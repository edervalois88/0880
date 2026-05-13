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
  const shipping: any = (session as any).shipping_details ?? {}
  const customer: any = session.customer_details ?? {}
  const address: any = shipping.address ?? customer.address ?? {}
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
  if (!shipping.shippingCity) {
    return { needsReview: true, reviewReason: 'Sin ciudad' }
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
