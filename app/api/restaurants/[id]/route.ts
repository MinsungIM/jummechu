// M3 restaurant — GET 식당 상세
import { ok, err } from '@/lib/http'
import { getRestaurant } from '@/features/restaurant'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id: idRaw } = await params
  const id = Number(idRaw)
  if (!Number.isInteger(id) || id <= 0) return err('VALIDATION_ERROR', 'invalid id', 400)

  const restaurant = await getRestaurant(id)
  if (!restaurant) return err('RESTAURANT_NOT_FOUND', `Restaurant ${id} not found`, 404)
  return ok(restaurant)
}
