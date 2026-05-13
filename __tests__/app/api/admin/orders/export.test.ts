import { GET } from '@/app/api/admin/orders/export/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

import { auth } from '@/auth'

describe('GET /api/admin/orders/export', () => {
  beforeEach(async () => {
    await prisma.order.deleteMany({})
    await prisma.product.deleteMany({})
  })

  afterEach(async () => {
    await prisma.order.deleteMany({})
    await prisma.product.deleteMany({})
  })

  it('returns 401 if not authenticated', async () => {
    ;(auth as jest.Mock).mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost:3000/api/admin/orders/export')
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('returns 401 if not admin', async () => {
    ;(auth as jest.Mock).mockResolvedValueOnce({
      user: { email: 'user@example.com', role: 'user' },
    })

    const req = new NextRequest('http://localhost:3000/api/admin/orders/export')
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('exports all orders as CSV when no filters', async () => {
    ;(auth as jest.Mock).mockResolvedValueOnce({
      user: { email: 'admin@example.com', role: 'admin' },
    })

    const product = await prisma.product.create({
      data: {
        name: 'Ring',
        price: 150,
        stock: 10,
        collection: 'Rings',
        image: 'https://example.com/ring.jpg',
        color: 'gold',
        design: 'classic',
      },
    })
    await prisma.order.create({
      data: {
        productId: product.id,
        total: 150,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '1234567890',
        shippingName: 'John Doe',
        shippingLine1: 'Calle 1',
        shippingCity: 'León',
        shippingCountry: 'MX',
        stripeSessionId: 'sess_1',
        status: 'succeeded',
      },
    })

    const req = new NextRequest('http://localhost:3000/api/admin/orders/export')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/csv')
    const csv = await res.text()
    expect(csv).toContain('Order #')
    expect(csv).toContain('John Doe')
  })

  it('exports only filtered orders by collection', async () => {
    ;(auth as jest.Mock).mockResolvedValueOnce({
      user: { email: 'admin@example.com', role: 'admin' },
    })

    const prod1 = await prisma.product.create({
      data: {
        name: 'Ring',
        price: 150,
        stock: 10,
        collection: 'Rings',
        image: 'https://example.com/ring.jpg',
        color: 'gold',
        design: 'classic',
      },
    })
    const prod2 = await prisma.product.create({
      data: {
        name: 'Necklace',
        price: 200,
        stock: 10,
        collection: 'Necklaces',
        image: 'https://example.com/necklace.jpg',
        color: 'silver',
        design: 'modern',
      },
    })
    await prisma.order.create({
      data: {
        productId: prod1.id,
        total: 150,
        customerName: 'John',
        customerEmail: 'john@example.com',
        stripeSessionId: 'sess_1',
        status: 'succeeded',
      },
    })
    await prisma.order.create({
      data: {
        productId: prod2.id,
        total: 200,
        customerName: 'Jane',
        customerEmail: 'jane@example.com',
        stripeSessionId: 'sess_2',
        status: 'succeeded',
      },
    })

    const req = new NextRequest(
      'http://localhost:3000/api/admin/orders/export?collection=Rings'
    )
    const res = await GET(req)

    const csv = await res.text()
    expect(csv).toContain('John')
    expect(csv).not.toContain('Jane')
  })

  it('CSV has correct headers', async () => {
    ;(auth as jest.Mock).mockResolvedValueOnce({
      user: { email: 'admin@example.com', role: 'admin' },
    })

    const product = await prisma.product.create({
      data: {
        name: 'Ring',
        price: 150,
        stock: 10,
        collection: 'Rings',
        image: 'https://example.com/ring.jpg',
        color: 'gold',
        design: 'classic',
      },
    })
    await prisma.order.create({
      data: {
        productId: product.id,
        total: 150,
        customerName: 'John',
        customerEmail: 'john@example.com',
        stripeSessionId: 'sess_1',
        status: 'succeeded',
      },
    })

    const req = new NextRequest('http://localhost:3000/api/admin/orders/export')
    const res = await GET(req)

    const csv = await res.text()
    const headers = csv.split('\n')[0]
    expect(headers).toContain('Order #')
    expect(headers).toContain('Date')
    expect(headers).toContain('Customer Name')
    expect(headers).toContain('Product')
    expect(headers).toContain('Collection')
    expect(headers).toContain('Total (MXN)')
  })
})
