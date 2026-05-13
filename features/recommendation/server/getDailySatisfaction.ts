// getDailySatisfaction — 사용자 본인이 최근 7일간 남긴 별점 평균
// functional-design.md §2.8
import { eq, gte, and, isNotNull, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { restaurantRatings, menuRatings } from '@/drizzle/schema'
import { RECENT_VISIT_WINDOW_DAYS } from './_lib/constants'
import type { Satisfaction } from '../types'

export async function getDailySatisfaction(userId: number): Promise<Satisfaction | null> {
  const db = getDb()
  const sinceTs = Date.now() - RECENT_VISIT_WINDOW_DAYS * 24 * 60 * 60 * 1000

  const rRows = await db
    .select({
      sum: sql<number | null>`SUM(${restaurantRatings.stars})`.as('sum'),
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(restaurantRatings)
    .where(
      and(
        eq(restaurantRatings.raterUserId, userId),
        gte(restaurantRatings.createdAt, sinceTs),
        isNotNull(restaurantRatings.stars)
      )
    )

  const mRows = await db
    .select({
      sum: sql<number | null>`SUM(${menuRatings.stars})`.as('sum'),
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(menuRatings)
    .where(and(eq(menuRatings.raterUserId, userId), gte(menuRatings.createdAt, sinceTs)))

  const rSum = Number(rRows[0]?.sum ?? 0)
  const rCount = Number(rRows[0]?.count ?? 0)
  const mSum = Number(mRows[0]?.sum ?? 0)
  const mCount = Number(mRows[0]?.count ?? 0)

  const total = rCount + mCount
  if (total === 0) return null
  return { avgStars: (rSum + mSum) / total, count: total }
}
