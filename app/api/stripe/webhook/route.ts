import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { recordPaidSession } from '@/lib/stripe-sync';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia',
});

export async function POST(req: NextRequest) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    logger.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET no está configurado');
    return NextResponse.json({ error: 'Webhook no configurado' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    logger.error(`[stripe-webhook] signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    try {
      const result = await recordPaidSession(session);
      logger.info(`[stripe-webhook] ${event.id}: ${JSON.stringify(result)}`);
    } catch (err: any) {
      logger.error(`[stripe-webhook] ${event.id} failed: ${err.message}`);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  } else {
    logger.info(`[stripe-webhook] unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
