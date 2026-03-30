import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

async function ensureAdmin(request: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return null
  }
  return session
}

// GET /api/admin/products
export async function GET(request: NextRequest) {
  try {
    const session = await ensureAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching products' },
      { status: 500 }
    )
  }
}

// POST /api/admin/products
export async function POST(request: NextRequest) {
  try {
    const session = await ensureAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const product = await prisma.product.create({
      data: {
        name: body.name,
        collection: body.collection,
        price: parseInt(body.price),
        image: body.image,
        color: body.color,
        design: body.design,
        descEs: body.descEs || '',
        descEn: body.descEn || '',
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: 'CREATE',
        resource: 'Product',
        resourceId: product.id.toString(),
        changes: JSON.stringify(product),
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating product' },
      { status: 500 }
    )
  }
}
