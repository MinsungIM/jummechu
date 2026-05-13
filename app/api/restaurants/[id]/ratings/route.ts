// M4 rating — 식당 평가 (T-D 트랙)
// GET stats / POST rateRestaurant
import { NextResponse } from 'next/server'
import {
  rateRestaurant,
  getRestaurantRatingStats,
  ValidationError,
  NotEligibleError,
} from '@/features/rating'
import { requireUser, UnauthorizedError } from '@/features/auth'
import { ok, err } from '@/lib/http'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    await requireUser()
    const { id } = await params
    const restaurantId = Number(id)
    if (!Number.isFinite(restaurantId)) return err('VALIDATION_ERROR', 'invalid restaurantId', 400)
    const stats = await getRestaurantRatingStats(restaurantId)
    return ok(stats)
  } catch (e) {
    return mapError(e)
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const user = await requireUser()
    const { id } = await params
    const restaurantId = Number(id)
    if (!Number.isFinite(restaurantId)) return err('VALIDATION_ERROR', 'invalid restaurantId', 400)

    const body = (await req.json().catch(() => ({}))) as {
      partyId?: number
      stars?: number
      comment?: string
      tagLabels?: string[]
    }
    const partyId = Number(body.partyId)
    if (!Number.isFinite(partyId)) return err('VALIDATION_ERROR', 'partyId 필요', 400)

    const rating = await rateRestaurant(
      user.id,
      restaurantId,
      partyId,
      body.stars,
      body.comment,
      body.tagLabels
    )
    return NextResponse.json({ data: rating }, { status: 201 })
  } catch (e) {
    return mapError(e)
  }
}

function mapError(e: unknown): Response {
  if (e instanceof UnauthorizedError) return err(e.code, e.message, e.status)
  if (e instanceof ValidationError)
    return NextResponse.json(
      { error: { code: e.code, message: e.message, fieldErrors: e.fieldErrors } },
      { status: e.status }
    )
  if (e instanceof NotEligibleError) return err(e.code, e.message, e.status)
  console.error('[api/restaurants/[id]/ratings]', e)
  return err('INTERNAL', '서버 오류', 500)
}
