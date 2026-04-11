import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// GET /api/products
// Endpoint público para obtener catálogo
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        published: true
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(products)
  } catch (error) {
    logger.error({ error }, 'GET /api/products failed')
    return NextResponse.json(
      { error: 'Error fetching catalog' },
      { status: 500 }
    )
  }
}
