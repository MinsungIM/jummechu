// M3 restaurant — 식당 해시태그 추가 (M7 입력기)
import { ok, err } from '@/lib/http'
import { tagRestaurant, RestaurantNotFoundError, ValidationError } from '@/features/restaurant'
import { requireUser, UnauthorizedError } from '@/features/auth'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const { id: idRaw } = await params
  const id = Number(idRaw)
  if (!Number.isInteger(id) || id <= 0) return err('VALIDATION_ERROR', 'invalid id', 400)

  let body: { label?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return err('VALIDATION_ERROR', 'invalid json body', 400)
  }
  const label = typeof body.label === 'string' ? body.label : ''

  try {
    const user = await requireUser()
    await tagRestaurant(id, label, user.id)
    return ok({ tagged: true })
  } catch (e) {
    if (e instanceof UnauthorizedError) return err(e.code, e.message, 401)
    if (e instanceof ValidationError) return err(e.code, e.message, 400)
    if (e instanceof RestaurantNotFoundError) return err(e.code, e.message, 404)
    if (e instanceof Error) return err('INTERNAL', e.message, 500)
    return err('INTERNAL', 'Unknown error', 500)
  }
}
