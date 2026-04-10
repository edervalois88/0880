import { NextRequest, NextResponse } from 'next/server'
import { ensureAdmin } from '@/lib/auth-utils'
import { ProductService } from '@/services/product.service'
import { logger } from '@/lib/logger'

// GET /api/admin/products
export async function GET(request: NextRequest) {
  try {
    const session = await ensureAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const products = await ProductService.getAll()
    return NextResponse.json(products)
  } catch (error) {
    logger.error({ error }, 'GET /api/admin/products failed')
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
    const product = await ProductService.create(body, session.user.id as string)

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'POST /api/admin/products failed')
    return NextResponse.json(
      { error: 'Error creating product' },
      { status: 500 }
    )
  }
}
