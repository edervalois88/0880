import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia', // Use latest or appropriate version
});

export async function POST(req: NextRequest) {
  try {
    const { productId, name, price, image } = await req.json();

    if (!productId || !name || !price) {
      return NextResponse.json({ error: 'Faltan datos del producto' }, { status: 400 });
    }

    // El precio viene en MXN, Stripe lo espera en centavos
    const amount = Math.round(price * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: name,
              images: [process.env.NEXTAUTH_URL + image], // Imagen completa
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/#catalog`,
      metadata: {
        productId: productId.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
