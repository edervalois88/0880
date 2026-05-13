import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/auth'
import { recordPaidSession, type RecordResult } from '@/lib/stripe-sync'
import { logger } from '@/lib/logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

async function ensureAdmin() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
}

export async function POST() {
  try {
    await ensureAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const since = Math.floor(Date.now() / 1000) - 30 * 24 * 3600

  let sessions
  try {
    sessions = await stripe.checkout.sessions.list({
      created: { gte: since },
      limit: 100,
    })
  } catch (err: any) {
    logger.error(`[stripe-sync-admin] Stripe list failed: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 502 })
  }

  const results: RecordResult[] = []
  for (const s of sessions.data) {
    if (s.payment_status !== 'paid') continue
    try {
      const full = await stripe.checkout.sessions.retrieve(s.id)
      results.push(await recordPaidSession(full as any))
    } catch (err: any) {
      logger.error(`[stripe-sync-admin] failed to process ${s.id}: ${err.message}`)
    }
  }

  const summary = {
    total: results.length,
    created: results.filter((r) => r.status === 'created').length,
    flagged: results.filter((r) => r.status === 'flagged').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
  }
  logger.info(`[stripe-sync-admin] result ${JSON.stringify(summary)}`)
  return NextResponse.json(summary)
}
