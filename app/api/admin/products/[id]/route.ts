import { NextRequest, NextResponse } from 'next/server'
import { ensureAdmin } from '@/lib/auth-utils'
import { ProductService } from '@/services/product.service'
import { logger } from '@/lib/logger'

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
    const paramsResolved = await params
    const id = parseInt(paramsResolved.id)

    const product = await ProductService.update(id, body, session.user.id as string)

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

    const paramsResolved = await params
    const id = parseInt(paramsResolved.id)

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
