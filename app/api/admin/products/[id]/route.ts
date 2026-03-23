import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/auth.config'

async function ensureAdmin(request: NextRequest) {
  const session: any = await getServerSession(authConfig)
  if (!session?.user || session.user.role !== 'admin') {
    return null
  }
  return session
}

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

    const oldProduct = await prisma.product.findUnique({ where: { id } })
    if (!oldProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const product = await prisma.product.update({
      where: { id },
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
        action: 'UPDATE',
        resource: 'Product',
        resourceId: id.toString(),
        changes: JSON.stringify({ before: oldProduct, after: product }),
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error updating product' },
      { status: 500 }
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

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    await prisma.product.delete({ where: { id } })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: 'DELETE',
        resource: 'Product',
        resourceId: id.toString(),
        changes: JSON.stringify(product),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error deleting product' },
      { status: 500 }
    )
  }
}
