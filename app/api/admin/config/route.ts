import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/auth.config'

async function ensureAdmin(request: NextRequest) {
  const session = await getServerSession(authConfig)
  if (!session?.user || session.user.role !== 'admin') {
    return null
  }
  return session
}

// GET /api/admin/config
export async function GET(request: NextRequest) {
  try {
    let config = await prisma.config.findUnique({
      where: { id: 'singleton' },
    })

    if (!config) {
      config = await prisma.config.create({
        data: { id: 'singleton' },
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching config' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/config
export async function PUT(request: NextRequest) {
  try {
    const session = await ensureAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const oldConfig = await prisma.config.findUnique({
      where: { id: 'singleton' },
    })

    const config = await prisma.config.update({
      where: { id: 'singleton' },
      data: {
        siteName: body.siteName,
        whatsappNumber: body.whatsappNumber,
        currency: body.currency,
        heroTitle1: body.heroTitle1,
        heroTitle2: body.heroTitle2,
        heroSubtitle: body.heroSubtitle,
        primaryColor: body.primaryColor,
        backgroundColor: body.backgroundColor,
        updatedBy: session.user.email as string,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        action: 'UPDATE',
        resource: 'Config',
        resourceId: 'singleton',
        changes: JSON.stringify({ before: oldConfig, after: config }),
      },
    })

    return NextResponse.json(config)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error updating config' },
      { status: 500 }
    )
  }
}
