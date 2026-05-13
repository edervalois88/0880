import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const collection = searchParams.get('collection') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const status = searchParams.get('status') || ''
    const reviewOnly = searchParams.get('reviewOnly') === 'true'

    const where: any = {}

    if (search && search.length >= 2) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (collection) {
      where.product = { collection }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) {
        const df = dateFrom ? new Date(dateFrom) : null
        const dt = new Date(dateTo)
        if (!df || df <= dt) {
          where.createdAt.lte = dt
        }
      }
    }

    if (status) where.status = status
    if (reviewOnly) where.needsReview = true

    const orders = await prisma.order.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    })

    const headers = [
      'Order #',
      'Date',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Product',
      'Collection',
      'Total (MXN)',
      'Payment Status',
      'Shipping Status',
      'Tracking',
      'Shipping Line 1',
      'Shipping Line 2 (Colonia)',
      'Shipping City',
      'Shipping State',
      'Shipping Postal Code',
      'Shipping Country',
      'Shipping References',
      'Needs Review',
      'Review Reason',
    ]

    const rows = orders.map((order) => [
      `#0880-${String(order.orderNumber).padStart(5, '0')}`,
      new Date(order.createdAt).toLocaleString('es-MX'),
      order.customerName || '',
      order.customerEmail || '',
      order.customerPhone || '',
      order.product.name,
      order.product.collection,
      order.total.toString(),
      order.status,
      order.shippingStatus || '',
      order.trackingNumber || '',
      order.shippingLine1 || '',
      order.shippingNeighborhood || '',
      order.shippingCity || '',
      order.shippingState || '',
      order.shippingPostalCode || '',
      order.shippingCountry || '',
      order.shippingReferences || '',
      order.needsReview ? 'Sí' : 'No',
      order.reviewReason || '',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const escaped = String(cell).replace(/"/g, '""')
            return escaped.includes(',') ? `"${escaped}"` : escaped
          })
          .join(',')
      ),
    ].join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
