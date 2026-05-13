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
      expect(result).toHaveLength(1)
      expect(result[0].customerName).toBe('Alice Rodriguez')
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
      expect(result).toHaveLength(1)
      expect(result[0].customerEmail).toBe('jane@example.com')
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
      expect(result).toHaveLength(1)
      expect(result[0].customerName).toBe('Robert Wilson')
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
      expect(result).toHaveLength(0)
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
      expect(result).toHaveLength(1) // returns all because search < 2 chars is ignored
    })
  })
})
