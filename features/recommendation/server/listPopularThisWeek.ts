// listPopularThisWeek — 최근 7일 식당 평가 TOP (count >= POPULAR_MIN_COUNT)
// functional-design.md §2.9
import { sql, gte } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { restaurants, restaurantRatings } from '@/drizzle/schema'
import { RECENT_VISIT_WINDOW_DAYS, POPULAR_MIN_COUNT } from './_lib/constants'
import type { RecommendationItem } from '../types'

export async function listPopularThisWeek(): Promise<RecommendationItem[]> {
  const db = getDb()
  const sinceTs = Date.now() - RECENT_VISIT_WINDOW_DAYS * 24 * 60 * 60 * 1000

  const rows = await db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      avgStars: sql<number | null>`AVG(${restaurantRatings.stars})`.as('avgStars'),
      count: sql<number>`COUNT(${restaurantRatings.id})`.as('count'),
    })
    .from(restaurants)
    .innerJoin(restaurantRatings, sql`${restaurantRatings.restaurantId} = ${restaurants.id}`)
    .where(gte(restaurantRatings.createdAt, sinceTs))
    .groupBy(restaurants.id)
    .having(sql`COUNT(${restaurantRatings.id}) >= ${POPULAR_MIN_COUNT}`)
    .orderBy(sql`AVG(${restaurantRatings.stars}) DESC`)
    .limit(10)

  return rows.map((r) => ({
    restaurantId: r.id,
    restaurantName: r.name,
    reason: 'high_rated' as const,
    score: r.avgStars === null || r.avgStars === undefined ? 0 : Number(r.avgStars),
  }))
}
