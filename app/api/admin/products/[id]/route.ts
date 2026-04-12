import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ensureAdmin } from '@/lib/auth-utils'
import { ProductService } from '@/services/product.service'
import { logger } from '@/lib/logger'

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  collection: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  image: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  design: z.string().min(1).optional(),
  descEs: z.string().optional(),
  descEn: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
})

// PUT /api/admin/products/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await ensureAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { id: idStr } = await params
    const id = parseInt(idStr)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const product = await ProductService.update(id, parsed.data, session.user.id as string)
    return NextResponse.json(product)
  } catch (error) {
    logger.error({ error }, `PUT /api/admin/products/[id] failed`)
    const status = error instanceof Error && error.message === 'Product not found' ? 404 : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error updating product' },
      { status }
    )
  }
}

// DELETE /api/admin/products/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await ensureAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idStr } = await params
    const id = parseInt(idStr)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    await ProductService.delete(id, session.user.id as string)
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, `DELETE /api/admin/products/[id] failed`)
    const status = error instanceof Error && error.message === 'Product not found' ? 404 : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error deleting product' },
      { status }
    )
  }
}
