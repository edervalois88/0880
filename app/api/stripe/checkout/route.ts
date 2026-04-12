import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

export async function POST(req: NextRequest) {
  try {
    const { productId, name, price, image } = await req.json();

    // Obtener la URL base de forma robusta
    const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.get('host')}`;

    if (!productId || !name || !price) {
      return NextResponse.json({ error: 'Faltan datos del producto' }, { status: 400 });
    }

    // Validar stock antes de crear sesión Stripe
    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product || product.stock <= 0) {
      return NextResponse.json({ error: 'Producto agotado' }, { status: 409 });
    }

    // El precio viene en MXN, Stripe lo espera en centavos
    const amount = Math.round(price * 100);

    // Asegurar que la imagen sea una URL completa
    const imageUrl = image?.startsWith('http') ? image : `${baseUrl}${image}`;

    console.log('Iniciando Checkout para:', { name, amount, imageUrl, baseUrl });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: name,
              images: [imageUrl],
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/#catalog`,
      metadata: {
        productId: productId.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('CRITICAL: Stripe Checkout Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
