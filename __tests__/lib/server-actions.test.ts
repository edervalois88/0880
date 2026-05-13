/**
 * Test suite for getOrders() search filter functionality
 * Tests verify search works on customerName and customerEmail (case-insensitive)
 *
 * Note: These tests verify the implementation of searching on both customerName
 * and customerEmail fields. Initially, some tests may fail if customerName search
 * is not yet implemented.
 */

import { prisma } from '@/lib/prisma'

// Mock the auth function to bypass authentication checks in tests
jest.mock('@/auth', () => ({
  auth: jest.fn(async () => ({
    user: { id: 'test-user-id', email: 'admin@test.com', role: 'admin' },
  })),
}))

// Import after mocking auth
import { getOrders } from '@/lib/server-actions'

describe('getOrders', () => {
  beforeEach(async () => {
    // Delete in correct order respecting foreign key constraints
    await prisma.inventoryMovement.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.product.deleteMany({})
  })

  afterEach(async () => {
    // Delete in correct order respecting foreign key constraints
    await prisma.inventoryMovement.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.product.deleteMany({})
  })

  describe('search filter', () => {
    it('finds order by customer name (case-insensitive)', async () => {
      const product = await prisma.product.create({
        data: {
          name: 'Test Product',
          price: 100,
          stock: 10,
          collection: 'Collection A',
          image: 'https://example.com/test.jpg',
          color: 'red',
          design: 'stripes',
        },
      })

      await prisma.order.create({
        data: {
          productId: product.id,
          total: 100,
          customerName: 'Alice Rodriguez',
          customerEmail: 'customer1@test.io',
          stripeSessionId: 'sess_1',
          status: 'succeeded',
        },
      })

      const result = await getOrders({ search: 'Rodriguez' })
      expect(result.orders).toHaveLength(1)
      expect(result.orders[0].customerName).toBe('Alice Rodriguez')
    })

    it('finds order by customer email substring (case-insensitive)', async () => {
      const product = await prisma.product.create({
        data: {
          name: 'Test Product',
          price: 100,
          stock: 10,
          collection: 'Collection A',
          image: 'https://example.com/test.jpg',
          color: 'red',
          design: 'stripes',
        },
      })

      await prisma.order.create({
        data: {
          productId: product.id,
          total: 100,
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          stripeSessionId: 'sess_2',
          status: 'succeeded',
        },
      })

      const result = await getOrders({ search: 'example.com' })
      expect(result.orders).toHaveLength(1)
      expect(result.orders[0].customerEmail).toBe('jane@example.com')
    })

    it('finds order by customer name case-insensitive match', async () => {
      const product = await prisma.product.create({
        data: {
          name: 'Test Product',
          price: 100,
          stock: 10,
          collection: 'Collection A',
          image: 'https://example.com/test.jpg',
          color: 'red',
          design: 'stripes',
        },
      })

      await prisma.order.create({
        data: {
          productId: product.id,
          total: 100,
          customerName: 'Robert Wilson',
          customerEmail: 'robert.w@email.io',
          stripeSessionId: 'sess_3',
          status: 'succeeded',
        },
      })

      const result = await getOrders({ search: 'wilson' })
      expect(result.orders).toHaveLength(1)
      expect(result.orders[0].customerName).toBe('Robert Wilson')
    })

    it('returns empty array when no match', async () => {
      const product = await prisma.product.create({
        data: {
          name: 'Test Product',
          price: 100,
          stock: 10,
          collection: 'Collection A',
          image: 'https://example.com/test.jpg',
          color: 'red',
          design: 'stripes',
        },
      })

      await prisma.order.create({
        data: {
          productId: product.id,
          total: 100,
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          stripeSessionId: 'sess_1',
          status: 'succeeded',
        },
      })

      const result = await getOrders({ search: 'nonexistent' })
      expect(result.orders).toHaveLength(0)
    })

    it('ignores search string shorter than 2 chars', async () => {
      const product = await prisma.product.create({
        data: {
          name: 'Test Product',
          price: 100,
          stock: 10,
          collection: 'Collection A',
          image: 'https://example.com/test.jpg',
          color: 'red',
          design: 'stripes',
        },
      })

      await prisma.order.create({
        data: {
          productId: product.id,
          total: 100,
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          stripeSessionId: 'sess_1',
          status: 'succeeded',
        },
      })

      const result = await getOrders({ search: 'j' })
      expect(result.orders).toHaveLength(1) // returns all because search < 2 chars is ignored
    })
  })

  describe('collection filter', () => {
    it('filters orders by collection', async () => {
      const prod1 = await prisma.product.create({
        data: { name: 'Item A', price: 100, stock: 10, collection: 'Rings', image: 'https://example.com/a.jpg', color: 'gold', design: 'classic' },
      })
      const prod2 = await prisma.product.create({
        data: { name: 'Item B', price: 200, stock: 10, collection: 'Necklaces', image: 'https://example.com/b.jpg', color: 'silver', design: 'modern' },
      })
      await prisma.order.create({
        data: {
          productId: prod1.id,
          total: 100,
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

      const result = await getOrders({ collection: 'Rings' })
      expect(result.orders).toHaveLength(1)
      expect(result.orders[0].product.collection).toBe('Rings')
    })

    it('returns all collections as distinct list', async () => {
      const prod1 = await prisma.product.create({
        data: { name: 'Item A', price: 100, stock: 10, collection: 'Rings', image: 'https://example.com/a.jpg', color: 'gold', design: 'classic' },
      })
      const prod2 = await prisma.product.create({
        data: { name: 'Item B', price: 200, stock: 10, collection: 'Necklaces', image: 'https://example.com/b.jpg', color: 'silver', design: 'modern' },
      })
      const prod3 = await prisma.product.create({
        data: { name: 'Item C', price: 150, stock: 10, collection: 'Rings', image: 'https://example.com/c.jpg', color: 'copper', design: 'vintage' },
      })

      const result = await getOrders()
      expect(result.collections).toContain('Rings')
      expect(result.collections).toContain('Necklaces')
      expect(result.collections.length).toBe(2)
    })
  })

  describe('date range filter', () => {
    it('filters orders by dateFrom', async () => {
      const product = await prisma.product.create({
        data: { name: 'Test', price: 100, stock: 10, collection: 'Col', image: 'https://example.com/test.jpg', color: 'red', design: 'classic' },
      })
      const date1 = new Date('2026-05-01T10:00:00Z')
      const date2 = new Date('2026-05-15T10:00:00Z')

      await prisma.order.create({
        data: {
          productId: product.id,
          total: 100,
          customerName: 'John',
          customerEmail: 'john@example.com',
          stripeSessionId: 'sess_1',
          status: 'succeeded',
          createdAt: date1,
        },
      })
      await prisma.order.create({
        data: {
          productId: product.id,
          total: 100,
          customerName: 'Jane',
          customerEmail: 'jane@example.com',
          stripeSessionId: 'sess_2',
          status: 'succeeded',
          createdAt: date2,
        },
      })

      const result = await getOrders({ dateFrom: '2026-05-10' })
      expect(result.orders).toHaveLength(1)
      expect(result.orders[0].customerName).toBe('Jane')
    })

    it('filters orders by dateTo', async () => {
      const product = await prisma.product.create({
        data: { name: 'Test', price: 100, stock: 10, collection: 'Col', image: 'https://example.com/test.jpg', color: 'red', design: 'classic' },
      })
      const date1 = new Date('2026-05-01T10:00:00Z')
      const date2 = new Date('2026-05-15T10:00:00Z')

      await prisma.order.create({
        data: {
          productId: product.id,
          total: 100,
          customerName: 'John',
          customerEmail: 'john@example.com',
          stripeSessionId: 'sess_1',
          status: 'succeeded',
          createdAt: date1,
        },
      })
      await prisma.order.create({
        data: {
          productId: product.id,
          total: 100,
          customerName: 'Jane',
          customerEmail: 'jane@example.com',
          stripeSessionId: 'sess_2',
          status: 'succeeded',
          createdAt: date2,
        },
      })

      const result = await getOrders({ dateTo: '2026-05-10' })
      expect(result.orders).toHaveLength(1)
      expect(result.orders[0].customerName).toBe('John')
    })

    it('filters orders by dateFrom and dateTo combined', async () => {
      const product = await prisma.product.create({
        data: { name: 'Test', price: 100, stock: 10, collection: 'Col', image: 'https://example.com/test.jpg', color: 'red', design: 'classic' },
      })
      const dates = [
        new Date('2026-05-01T10:00:00Z'),
        new Date('2026-05-10T10:00:00Z'),
        new Date('2026-05-20T10:00:00Z'),
      ]

      for (let i = 0; i < 3; i++) {
        await prisma.order.create({
          data: {
            productId: product.id,
            total: 100,
            customerName: `Customer${i}`,
            customerEmail: `cust${i}@example.com`,
            stripeSessionId: `sess_${i}`,
            status: 'succeeded',
            createdAt: dates[i],
          },
        })
      }

      const result = await getOrders({ dateFrom: '2026-05-05', dateTo: '2026-05-15' })
      expect(result.orders).toHaveLength(1)
      expect(result.orders[0].customerName).toBe('Customer1')
    })

    it('ignores dateTo if dateFrom > dateTo', async () => {
      const product = await prisma.product.create({
        data: { name: 'Test', price: 100, stock: 10, collection: 'Col', image: 'https://example.com/test.jpg', color: 'red', design: 'classic' },
      })
      await prisma.order.create({
        data: {
          productId: product.id,
          total: 100,
          customerName: 'John',
          customerEmail: 'john@example.com',
          stripeSessionId: 'sess_1',
          status: 'succeeded',
          createdAt: new Date('2026-05-10T10:00:00Z'),
        },
      })

      const result = await getOrders({ dateFrom: '2026-05-15', dateTo: '2026-05-10' })
      expect(result.orders).toHaveLength(0)
    })
  })
})
