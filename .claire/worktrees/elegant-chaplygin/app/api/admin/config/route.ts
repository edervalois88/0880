import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ensureAdmin } from '@/lib/auth-utils'
import { ConfigService } from '@/services/config.service'
import { logger } from '@/lib/logger'

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color (#rrggbb)')

const updateConfigSchema = z.object({
  siteName: z.string().min(1).optional(),
  whatsappNumber: z.string().optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  heroTitle1: z.string().optional(),
  heroTitle2: z.string().optional(),
  heroSubtitle: z.string().optional(),
  primaryColor: hexColor.optional(),
  backgroundColor: hexColor.optional(),
})

// GET /api/admin/config
export async function GET(request: NextRequest) {
  try {
    const config = await ConfigService.get()
    return NextResponse.json(config)
  } catch (error) {
    logger.error({ error }, 'GET /api/admin/config failed')
    return NextResponse.json({ error: 'Error fetching config' }, { status: 500 })
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
    const parsed = updateConfigSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const config = await ConfigService.update(
      parsed.data,
      session.user.id as string,
      session.user.email as string
    )

    return NextResponse.json(config)
  } catch (error) {
    logger.error({ error }, 'PUT /api/admin/config failed')
    return NextResponse.json({ error: 'Error updating config' }, { status: 500 })
  }
}
