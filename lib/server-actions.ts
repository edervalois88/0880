'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

async function ensureAdmin() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

async function ensureEditorOrAdmin() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session?.user || (role !== 'admin' && role !== 'editor')) {
    throw new Error('Unauthorized')
  }
  return session
}

// PRODUCTOS
export async function getProducts() {
  await ensureEditorOrAdmin()
  try {
    return await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
  } catch (error) {
    throw new Error('Error fetching products')
  }
}

export async function createProduct(data: any) {
  const session = await ensureAdmin()

  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        collection: data.collection,
        price: parseInt(data.price),
        image: data.image,
        color: data.color,
        design: data.design,
        descEs: data.descEs || '',
        descEn: data.descEn || '',
        stock: parseInt(data.stock) || 0,
        published: data.published !== undefined ? data.published : true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: 'CREATE',
        resource: 'Product',
        resourceId: product.id.toString(),
        changes: JSON.stringify(product),
      },
    })

    revalidatePath('/admin')
    return product
  } catch (error) {
    throw new Error('Error creating product')
  }
}

export async function updateProduct(id: number, data: any) {
  const session = await ensureAdmin()

  try {
    const oldProduct = await prisma.product.findUnique({ where: { id } })

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        collection: data.collection,
        price: parseInt(data.price),
        image: data.image,
        color: data.color,
        design: data.design,
        descEs: data.descEs || '',
        descEn: data.descEn || '',
        stock: parseInt(data.stock) || 0,
        published: data.published !== undefined ? data.published : true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: 'UPDATE',
        resource: 'Product',
        resourceId: id.toString(),
        changes: JSON.stringify({ before: oldProduct, after: product }),
      },
    })

    revalidatePath('/admin')
    return product
  } catch (error) {
    throw new Error('Error updating product')
  }
}

export async function deleteProduct(id: number) {
  const session = await ensureAdmin()

  try {
    const product = await prisma.product.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: 'DELETE',
        resource: 'Product',
        resourceId: id.toString(),
        changes: JSON.stringify(product),
      },
    })

    revalidatePath('/admin')
    return product
  } catch (error) {
    throw new Error('Error deleting product')
  }
}

// CONFIGURACIÓN
export async function getConfig() {
  await ensureEditorOrAdmin()
  try {
    let config = await prisma.config.findUnique({ where: { id: 'singleton' } })
    if (!config) {
      config = await prisma.config.create({ data: { id: 'singleton' } })
    }
    return config
  } catch (error) {
    throw new Error('Error fetching config')
  }
}

export async function updateConfig(data: any) {
  const session = await ensureAdmin()

  try {
    const oldConfig = await prisma.config.findUnique({ where: { id: 'singleton' } })

    const config = await prisma.config.update({
      where: { id: 'singleton' },
      data: {
        siteName: data.siteName,
        whatsappNumber: data.whatsappNumber,
        currency: data.currency,
        heroTitle1: data.heroTitle1,
        heroTitle2: data.heroTitle2,
        heroSubtitle: data.heroSubtitle,
        primaryColor: data.primaryColor,
        backgroundColor: data.backgroundColor,
        updatedBy: session.user.email as string,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: 'UPDATE',
        resource: 'Config',
        resourceId: 'singleton',
        changes: JSON.stringify({ before: oldConfig, after: config }),
      },
    })

    revalidatePath('/admin')
    revalidatePath('/')
    return config
  } catch (error) {
    throw new Error('Error updating config')
  }
}

// USUARIOS
export async function getUsers() {
  await ensureAdmin()

  try {
    return await prisma.user.findMany({
      select: { id: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
  } catch (error) {
    throw new Error('Error fetching users')
  }
}

export async function updateUserRole(userId: string, role: string) {
  const session = await ensureAdmin()

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: 'UPDATE',
        resource: 'User',
        resourceId: userId,
        changes: JSON.stringify({ newRole: role }),
      },
    })

    revalidatePath('/admin')
    return user
  } catch (error) {
    throw new Error('Error updating user')
  }
}

export async function toggleUserActive(userId: string, active: boolean) {
  const session = await ensureAdmin()

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { active },
      select: { id: true, email: true, active: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: 'UPDATE',
        resource: 'User',
        resourceId: userId,
        changes: JSON.stringify({ active }),
      },
    })

    revalidatePath('/admin')
    return user
  } catch (error) {
    throw new Error('Error toggling user active status')
  }
}

export async function createUser(data: any) {
  const session = await ensureAdmin()

  try {
    const hashedPassword = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role || 'editor',
        active: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: 'CREATE',
        resource: 'User',
        resourceId: user.id,
        changes: JSON.stringify({ email: user.email, role: user.role }),
      },
    })

    revalidatePath('/admin')
    return user
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('El correo electrónico ya está registrado')
    }
    throw new Error('Error al crear usuario')
  }
}

export async function deleteUser(userId: string) {
  const session = await ensureAdmin()

  if (userId === (session.user as any).id) {
    throw new Error('No puedes eliminar tu propia cuenta administrativa')
  }

  try {
    const user = await prisma.user.delete({ where: { id: userId } })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: 'DELETE',
        resource: 'User',
        resourceId: userId,
        changes: JSON.stringify(user),
      },
    })

    revalidatePath('/admin')
    return user
  } catch (error) {
    throw new Error('Error al eliminar usuario')
  }
}

// MIGRACION
export async function migrateFromConstants() {
  const session = await ensureAdmin()

  try {
    const { productsData } = await import('@/app/data/constants')
    await prisma.product.deleteMany()

    const migrated = await Promise.all(
      productsData.map((p: any) =>
        prisma.product.create({
          data: {
            name: p.name,
            collection: p.collection,
            price: p.price,
            image: p.image,
            color: p.color,
            design: p.design,
            descEs: p.desc?.es || '',
            descEn: p.desc?.en || '',
          },
        })
      )
    )

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: 'CREATE',
        resource: 'Product',
        resourceId: 'MIGRATION',
        changes: JSON.stringify({ count: migrated.length }),
      },
    })

    revalidatePath('/admin')
    return { success: true, count: migrated.length }
  } catch (error) {
    throw new Error('Error during migration')
  }
}

// DASHBOARD & ANALYTICS
export async function getDashboardStats() {
  await ensureEditorOrAdmin()

  try {
    const now = new Date()
    const last7Days = new Date(now.setDate(now.getDate() - 7))

    const totalSales = await prisma.order.aggregate({
      _sum: { total: true },
      _count: { id: true },
    })

    const orderCount = totalSales._count.id || 0
    const salesSum = totalSales._sum.total || 0
    const aov = orderCount > 0 ? Math.round(salesSum / orderCount) : 0

    const salesByDayRaw = await prisma.order.groupBy({
      by: ['createdAt'],
      _sum: { total: true },
      where: { createdAt: { gte: last7Days } },
    })

    const salesByDay = salesByDayRaw.reduce((acc: any[], curr) => {
      const date = curr.createdAt.toLocaleDateString('es-MX', { weekday: 'short' })
      const existing = acc.find((a) => a.name === date)
      if (existing) {
        existing.ventas += curr._sum.total || 0
      } else {
        acc.push({ name: date, ventas: curr._sum.total || 0 })
      }
      return acc
    }, [])

    const topProductsRaw = await prisma.order.groupBy({
      by: ['productId'],
      _count: { id: true },
      _sum: { total: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })

    const topProducts = await Promise.all(
      topProductsRaw.map(async (tp) => {
        const product = await prisma.product.findUnique({ where: { id: tp.productId } })
        return {
          name: product?.name || 'Unknown',
          ventas: tp._count.id,
          total: tp._sum.total,
        }
      })
    )

    const statsByCollection = await prisma.product.groupBy({
      by: ['collection'],
      _count: { id: true },
    })

    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { lte: 3 } },
      select: { id: true, name: true, stock: true, image: true },
    })

    const recentActivity = await prisma.inventoryMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { product: { select: { name: true } } },
    })

    return {
      totalSales: salesSum,
      orderCount,
      aov,
      salesByDay,
      topProducts,
      statsByCollection,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      recentActivity,
    }
  } catch (error) {
    console.error('Stats error:', error)
    return { error: 'Failed to fetch stats' }
  }
}

// INVENTARIO
export async function getInventoryLogs() {
  await ensureEditorOrAdmin()
  return await prisma.inventoryMovement.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: true },
    take: 20,
  })
}

export async function addInventoryMovement(data: {
  productId: number
  type: 'IN' | 'OUT'
  quantity: number
  reason: string
}) {
  const session = await ensureAdmin()

  try {
    const product = await prisma.product.findUnique({ where: { id: data.productId } })
    if (!product) throw new Error('Product not found')

    const newStock =
      data.type === 'IN'
        ? product.stock + data.quantity
        : product.stock - data.quantity

    return await prisma.$transaction([
      prisma.product.update({
        where: { id: data.productId },
        data: { stock: newStock },
      }),
      prisma.inventoryMovement.create({
        data: {
          productId: data.productId,
          type: data.type,
          quantity: data.quantity,
          reason: data.reason,
          userId: session.user.id as string,
        },
      }),
    ])
  } catch (error) {
    throw new Error('Failed to adjust inventory')
  }
}

export async function toggleProductVisibility(id: number, published: boolean) {
  await ensureAdmin()
  try {
    const product = await prisma.product.update({ where: { id }, data: { published } })
    revalidatePath('/admin')
    revalidatePath('/')
    return product
  } catch (error) {
    throw new Error('Error toggling visibility')
  }
}

// PEDIDOS
export async function getOrders(filters?: { search?: string; status?: string }) {
  await ensureAdmin()
  try {
    return await prisma.order.findMany({
      where: {
        ...(filters?.search ? { customerEmail: { contains: filters.search, mode: 'insensitive' } } : {}),
        ...(filters?.status && filters.status !== 'all' ? { shippingStatus: filters.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { name: true, image: true, collection: true } } },
      take: 100,
    })
  } catch (error) {
    throw new Error('Error fetching orders')
  }
}

export async function updateOrderFulfillment(
  orderId: string,
  data: { shippingStatus?: string; trackingNumber?: string; notes?: string }
) {
  await ensureAdmin()
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        shippingStatus: data.shippingStatus,
        trackingNumber: data.trackingNumber ?? null,
        notes: data.notes ?? null,
        fulfillmentDate: data.shippingStatus === 'delivered' ? new Date() : undefined,
      },
    })
    revalidatePath('/admin')
    return order
  } catch (error) {
    throw new Error('Error updating order')
  }
}

// CLIENTES
export async function getCustomers() {
  await ensureAdmin()
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { name: true, image: true } } },
    })

    const map = new Map<string, any>()
    for (const order of orders) {
      const existing = map.get(order.customerEmail)
      if (existing) {
        existing.orderCount += 1
        existing.totalSpent += order.total
        if (order.createdAt > existing.lastPurchase) {
          existing.lastPurchase = order.createdAt
        }
        existing.orders.push(order)
      } else {
        map.set(order.customerEmail, {
          email: order.customerEmail,
          orderCount: 1,
          totalSpent: order.total,
          lastPurchase: order.createdAt,
          orders: [order],
        })
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent)
  } catch (error) {
    throw new Error('Error fetching customers')
  }
}

// AUDIT LOGS
export async function getAuditLogs(filters?: {
  resource?: string
  action?: string
}) {
  await ensureAdmin()
  try {
    return await prisma.auditLog.findMany({
      where: {
        ...(filters?.resource ? { resource: filters.resource } : {}),
        ...(filters?.action ? { action: filters.action } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { email: true } } },
    })
  } catch (error) {
    throw new Error('Error fetching audit logs')
  }
}
