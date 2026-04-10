import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
  } catch (err: any) {
    logger.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Manejar el evento
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const productId = parseInt(session.metadata?.productId || '0');
      
      if (productId > 0) {
        // Transacción para asegurar consistencia
        await prisma.$transaction(async (tx) => {
          // 1. Crear Pedido
          await tx.order.create({
            data: {
              productId,
              total: Math.round((session.amount_total || 0) / 100), // Convertir a MXN
              customerEmail: session.customer_details?.email || 'unknown',
              stripeSessionId: session.id,
              status: 'succeeded'
            }
          });

          // 2. Registrar Movimiento de Inventario
          await tx.inventoryMovement.create({
            data: {
              productId,
              type: 'SALE',
              quantity: 1,
              reason: `Venta Stripe: ${session.id}`,
            }
          });

          // 3. Decrementar Stock
          await tx.product.update({
            where: { id: productId },
            data: { stock: { decrement: 1 } }
          });
        });
      }
      
      logger.info(`Payment Succeeded and Inventory updated for session: ${session.id}`);
      break;
    default:
      logger.info(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

export const config = {
  api: {
    bodyParser: false, // Stripe necesita el body raw para verificar la firma
  },
};
