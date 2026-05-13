// getAllRestaurantsForMap — Functional Design §4.11 (M6 사용)
// avgRating 은 현 단계에서 항상 null. T-D rating 완성 시 LEFT JOIN 으로 채움.
import { getDb } from '@/lib/db'
import { restaurants } from '@/drizzle/schema'
import type { RestaurantMapMarker } from '../types'

export async function getAllRestaurantsForMap(): Promise<RestaurantMapMarker[]> {
  const rows = await getDb()
    .select({
      id: restaurants.id,
      name: restaurants.name,
      lat: restaurants.lat,
      lng: restaurants.lng,
      category1: restaurants.category1,
      waitLevel: restaurants.waitLevel,
      reservationRequired: restaurants.reservationRequired,
    })
    .from(restaurants)
  return rows.map((r) => ({ ...r, avgRating: null }))
}
