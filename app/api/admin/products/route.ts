import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ensureAdmin, ensureEditorOrAdmin } from '@/lib/auth-utils'
import { ProductService } from '@/services/product.service'
import { logger } from '@/lib/logger'

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  collection: z.string().min(1, 'Collection is required'),
  price: z.number({ invalid_type_error: 'Price must be a number' }).positive('Price must be positive'),
  image: z.string().min(1, 'Image is required'),
  color: z.string().min(1, 'Color is required'),
  design: z.string().min(1, 'Design is required'),
  descEs: z.string().optional().default(''),
  descEn: z.string().optional().default(''),
  stock: z.number().int().min(0).optional().default(0),
  published: z.boolean().optional().default(true),
})

// GET /api/admin/products
export async function GET(request: NextRequest) {
  try {
    const session = await ensureEditorOrAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')))
    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      ProductService.getAll({ skip, take: limit }),
      ProductService.count(),
    ])

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    logger.error({ error }, 'GET /api/admin/products failed')
    return NextResponse.json({ error: 'Error fetching products' }, { status: 500 })
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
    const parsed = createProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const product = await ProductService.create(parsed.data, session.user.id as string)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'POST /api/admin/products failed')
    return NextResponse.json({ error: 'Error creating product' }, { status: 500 })
  }
}
