import { NextRequest, NextResponse } from 'next/server'
import { ensureAdmin } from '@/lib/auth-utils'
import { ConfigService } from '@/services/config.service'
import { logger } from '@/lib/logger'

// GET /api/admin/config
export async function GET(request: NextRequest) {
  try {
    const config = await ConfigService.get()
    return NextResponse.json(config)
  } catch (error) {
    logger.error({ error }, 'GET /api/admin/config failed')
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
    const config = await ConfigService.update(
      body, 
      session.user.id as string,
      session.user.email as string
    )

    return NextResponse.json(config)
  } catch (error) {
    logger.error({ error }, 'PUT /api/admin/config failed')
    return NextResponse.json(
      { error: 'Error updating config' },
      { status: 500 }
    )
  }
}
