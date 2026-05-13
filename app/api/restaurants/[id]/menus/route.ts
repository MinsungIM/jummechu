// M3 restaurant — 메뉴 조회/추가 (M3 메뉴 추가 모달)
import { ok, err } from '@/lib/http'
import {
  getMenusByRestaurant,
  addMenu,
  RestaurantNotFoundError,
  ValidationError,
} from '@/features/restaurant'
import { requireUser, UnauthorizedError } from '@/features/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id: idRaw } = await params
  const id = Number(idRaw)
  if (!Number.isInteger(id) || id <= 0) return err('VALIDATION_ERROR', 'invalid id', 400)

  const menus = await getMenusByRestaurant(id)
  return ok({ menus })
}

export async function POST(req: Request, { params }: Params) {
  const { id: idRaw } = await params
  const id = Number(idRaw)
  if (!Number.isInteger(id) || id <= 0) return err('VALIDATION_ERROR', 'invalid id', 400)

  let body: { name?: unknown; price?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return err('VALIDATION_ERROR', 'invalid json body', 400)
  }
  const name = typeof body.name === 'string' ? body.name : ''
  const price =
    body.price === null || body.price === undefined
      ? null
      : typeof body.price === 'number'
      ? body.price
      : Number(body.price)
  const priceFinal = price === null || Number.isNaN(price) ? null : price

  try {
    await requireUser()
    const menu = await addMenu(id, name, priceFinal)
    return ok(menu, 201)
  } catch (e) {
    if (e instanceof UnauthorizedError) return err(e.code, e.message, 401)
    if (e instanceof ValidationError) return err(e.code, e.message, 400)
    if (e instanceof RestaurantNotFoundError) return err(e.code, e.message, 404)
    if (e instanceof Error) return err('INTERNAL', e.message, 500)
    return err('INTERNAL', 'Unknown error', 500)
  }
}
