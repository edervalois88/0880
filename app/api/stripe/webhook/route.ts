import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { sendOrderConfirmation } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function addressFromSession(session: any) {
  const shipping = session.shipping_details || {};
  const customer = session.customer_details || {};
  const address = shipping.address || customer.address || {};

  return {
    customerName: customer.name || shipping.name || null,
    customerPhone: customer.phone || shipping.phone || null,
    shippingName: shipping.name || customer.name || null,
    shippingPhone: shipping.phone || customer.phone || null,
    shippingLine1: address.line1 || null,
    shippingLine2: address.line2 || null,
    shippingCity: address.city || null,
    shippingState: address.state || null,
    shippingPostalCode: address.postal_code || null,
    shippingCountry: address.country || null,
  };
}

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET no está configurado');
    return NextResponse.json({ error: 'Webhook no configurado' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
  } catch (err: any) {
    logger.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Manejar el evento
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as any;
      const productId = parseInt(session.metadata?.productId || '0');
      const shippingData = addressFromSession(session);
      
      logger.info(`EVENTO: Checkout completado para sesión ${session.id}. ID Producto: ${productId}`);
      console.log('--- STRIPE WEBHOOK DEBUG ---');
      console.log('Payment Status:', session.payment_status);
      console.log('Metadata:', session.metadata);
      console.log('Shipping:', session.shipping_details);

      if (session.payment_status !== 'paid') {
        logger.warn(`Checkout completado sin pago confirmado para sesión ${session.id}: ${session.payment_status}`);
        break;
      }

      const existingOrder = await prisma.order.findUnique({
        where: { stripeSessionId: session.id },
      });

      if (existingOrder) {
        logger.info(`Pedido ya procesado para sesión ${session.id}; ignorando reintento de webhook.`);
        break;
      }

      if (shippingData.shippingCountry !== 'MX') {
        logger.error(`Sesión ${session.id} sin dirección de envío mexicana. País recibido: ${shippingData.shippingCountry || 'N/A'}`);
        throw new Error('La dirección de envío debe estar en México');
      }
      
      if (productId > 0) {
        try {
          // Transacción para asegurar consistencia
          await prisma.$transaction(async (tx) => {
            // 1. Crear Pedido
            await tx.order.create({
              data: {
                productId,
                total: Math.round((session.amount_total || 0) / 100), // Convertir a MXN
                customerEmail: session.customer_details?.email || 'unknown',
                ...shippingData,
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
          logger.info(`SUCCESS: Inventario y Pedido actualizados para sesión: ${session.id}`);

          // Enviar email de confirmación (no bloquea el webhook si falla)
          try {
            const product = await prisma.product.findUnique({ where: { id: productId } });
            if (product && session.customer_details?.email) {
              await sendOrderConfirmation({
                customerEmail: session.customer_details.email,
                productName: product.name,
                productImage: product.image,
                productCollection: product.collection,
                total: Math.round((session.amount_total || 0) / 100),
                stripeSessionId: session.id,
              });
              logger.info(`Email de confirmación enviado a ${session.customer_details.email}`);
            }
          } catch (emailError: any) {
            logger.error(`Email error (non-blocking): ${emailError.message}`);
          }
        } catch (dbError: any) {
          logger.error(`DATABASE ERROR in Webhook: ${dbError.message}`);
          throw dbError; // Para que Stripe sepa que hubo un fallo
        }
      } else {
        logger.warn(`WARNING: Se recibió un pago pero no hay productId válido en metadata.`);
      }
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
