// getRestaurantRatingStats — AVG + tag JSON 파싱 application-layer 집계
// functional-design.md §2.3
import { eq, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { restaurantRatings } from '@/drizzle/schema'
import type { RestaurantRatingStats } from '../types'

export async function getRestaurantRatingStats(restaurantId: number): Promise<RestaurantRatingStats> {
  const db = getDb()

  // 별점 집계
  const aggRows = await db
    .select({
      avg: sql<number | null>`AVG(${restaurantRatings.stars})`.as('avg'),
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(restaurantRatings)
    .where(eq(restaurantRatings.restaurantId, restaurantId))
  const agg = aggRows[0]
  const count = Number(agg?.count ?? 0)
  const avgRaw = agg?.avg
  const avgStars = avgRaw === null || avgRaw === undefined ? 0 : Number(avgRaw)

  if (count === 0) {
    return { restaurantId, avgStars: 0, count: 0, tagFrequency: [] }
  }

  // 태그 빈도 — JSON 파싱
  const tagRows = await db
    .select({ tagsJson: restaurantRatings.tagsJson })
    .from(restaurantRatings)
    .where(eq(restaurantRatings.restaurantId, restaurantId))

  const freq = new Map<string, number>()
  for (const r of tagRows) {
    if (!r.tagsJson) continue
    try {
      const parsed = JSON.parse(r.tagsJson)
      if (!Array.isArray(parsed)) continue
      for (const raw of parsed) {
        if (typeof raw !== 'string') continue
        const label = raw.trim()
        if (!label) continue
        freq.set(label, (freq.get(label) ?? 0) + 1)
      }
    } catch {
      // ignore malformed
    }
  }

  const tagFrequency = Array.from(freq.entries())
    .map(([tagLabel, c]) => ({ tagLabel, count: c }))
    .sort((a, b) => b.count - a.count || a.tagLabel.localeCompare(b.tagLabel))

  return { restaurantId, avgStars, count, tagFrequency }
}
