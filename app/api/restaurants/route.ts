// M3 restaurant — GET 식당 목록 (지도용 / 태그 검색용)
//   ?tag=가성비   → searchRestaurantsByTag
//   ?forMap=1    → getAllRestaurantsForMap (지도 마커 리스트)
//   (그 외)       → 빈 태그 리스트 → 전체 식당 (listRestaurantsByTags([]))
import { ok, err } from '@/lib/http'
import {
  searchRestaurantsByTag,
  listRestaurantsByTags,
  getAllRestaurantsForMap,
  ValidationError,
} from '@/features/restaurant'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const tag = url.searchParams.get('tag')
  const forMap = url.searchParams.get('forMap')

  try {
    if (forMap === '1' || forMap === 'true') {
      const markers = await getAllRestaurantsForMap()
      return ok({ markers })
    }
    if (tag && tag.trim().length > 0) {
      const restaurants = await searchRestaurantsByTag(tag)
      return ok({ restaurants })
    }
    const restaurants = await listRestaurantsByTags([])
    return ok({ restaurants })
  } catch (e) {
    if (e instanceof ValidationError) return err(e.code, e.message, 400)
    if (e instanceof Error) return err('INTERNAL', e.message, 500)
    return err('INTERNAL', 'Unknown error', 500)
  }
}
