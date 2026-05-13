// listRestaurantsByTags — Functional Design §4.3
// 빈 배열 → 전체 식당. 여러 태그 입력 시 AND 시맨틱 (해당 모든 태그를 가진 식당).
import { inArray, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { restaurants, restaurantTags } from '@/drizzle/schema'
import { loadRestaurantsWithTags } from './_lib/loadRestaurantWithTags'
import type { Restaurant } from '../types'

export async function listRestaurantsByTags(tagIds: number[]): Promise<Restaurant[]> {
  const db = getDb()

  if (tagIds.length === 0) {
    const rows = await db.select().from(restaurants).orderBy(restaurants.name)
    return loadRestaurantsWithTags(db, rows)
  }

  // AND 시맨틱: 식당이 입력된 모든 tagId 를 가질 때만 통과
  const matched = await db
    .select({ restaurantId: restaurantTags.restaurantId })
    .from(restaurantTags)
    .where(inArray(restaurantTags.tagId, tagIds))
    .groupBy(restaurantTags.restaurantId)
    .having(sql`COUNT(DISTINCT ${restaurantTags.tagId}) = ${tagIds.length}`)

  const matchedIds = matched.map((m) => m.restaurantId)
  if (matchedIds.length === 0) return []

  const rows = await db
    .select()
    .from(restaurants)
    .where(inArray(restaurants.id, matchedIds))
    .orderBy(restaurants.name)
  return loadRestaurantsWithTags(db, rows)
}
