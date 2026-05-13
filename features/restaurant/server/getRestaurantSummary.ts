// getRestaurantSummary — Functional Design §4.2 (M2 사용)
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { restaurants } from '@/drizzle/schema'
import type { RestaurantSummary } from '../types'

export async function getRestaurantSummary(id: number): Promise<RestaurantSummary | null> {
  const rows = await getDb()
    .select({
      id: restaurants.id,
      name: restaurants.name,
      category1: restaurants.category1,
      lat: restaurants.lat,
      lng: restaurants.lng,
    })
    .from(restaurants)
    .where(eq(restaurants.id, id))
    .limit(1)
  return rows[0] ?? null
}
