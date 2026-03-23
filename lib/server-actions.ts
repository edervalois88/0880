'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Verificar que el usuario es admin
async function ensureAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

// PRODUCTOS
export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return products
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
      },
    })

    // Log de auditoría
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
      },
    })

    // Log de auditoría
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

    // Log de auditoría
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
  try {
    let config = await prisma.config.findUnique({
      where: { id: 'singleton' },
    })

    if (!config) {
      config = await prisma.config.create({
        data: { id: 'singleton' },
      })
    }

    return config
  } catch (error) {
    throw new Error('Error fetching config')
  }
}

export async function updateConfig(data: any) {
  const session = await ensureAdmin()

  try {
    const oldConfig = await prisma.config.findUnique({
      where: { id: 'singleton' },
    })

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

    // Log de auditoría
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
  const session = await ensureAdmin()

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return users
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

    // Log de auditoría
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

    // Log de auditoría
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

// MIGRACION: mover contenido de constants.js a BD
export async function migrateFromConstants() {
  const session = await ensureAdmin()

  try {
    const { productsData } = await import('@/app/data/constants')

    // Limpiar productos existentes
    await prisma.product.deleteMany()

    // Insertar productos del constants
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

    // Log
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
