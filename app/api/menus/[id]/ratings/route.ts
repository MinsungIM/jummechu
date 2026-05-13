// M4 rating — 메뉴 평가 (T-D 트랙)
// GET stats / POST rateMenu
import { NextResponse } from 'next/server'
import {
  rateMenu,
  getMenuRatingStats,
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
    const menuId = Number(id)
    if (!Number.isFinite(menuId)) return err('VALIDATION_ERROR', 'invalid menuId', 400)
    const stats = await getMenuRatingStats(menuId)
    return ok(stats)
  } catch (e) {
    return mapError(e)
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const user = await requireUser()
    const { id } = await params
    const menuId = Number(id)
    if (!Number.isFinite(menuId)) return err('VALIDATION_ERROR', 'invalid menuId', 400)

    const body = (await req.json().catch(() => ({}))) as {
      partyId?: number
      stars?: number
      comment?: string
    }
    const partyId = Number(body.partyId)
    if (!Number.isFinite(partyId)) return err('VALIDATION_ERROR', 'partyId 필요', 400)
    const stars = Number(body.stars)
    if (!Number.isFinite(stars)) return err('VALIDATION_ERROR', 'stars 필요', 400)

    const rating = await rateMenu(user.id, menuId, partyId, stars, body.comment)
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
  console.error('[api/menus/[id]/ratings]', e)
  return err('INTERNAL', '서버 오류', 500)
}
