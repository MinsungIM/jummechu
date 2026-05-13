// getMenuRatingStats — 메뉴 평균 별점 / 평가 수
// functional-design.md §2.4
import { eq, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { menuRatings } from '@/drizzle/schema'
import type { MenuRatingStats } from '../types'

export async function getMenuRatingStats(menuId: number): Promise<MenuRatingStats> {
  const db = getDb()
  const rows = await db
    .select({
      avg: sql<number | null>`AVG(${menuRatings.stars})`.as('avg'),
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(menuRatings)
    .where(eq(menuRatings.menuId, menuId))
  const row = rows[0]
  const count = Number(row?.count ?? 0)
  const avgRaw = row?.avg
  const avgStars = avgRaw === null || avgRaw === undefined ? 0 : Number(avgRaw)
  return { menuId, avgStars: count === 0 ? 0 : avgStars, count }
}
