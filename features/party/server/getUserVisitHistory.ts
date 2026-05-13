// getUserVisitHistory — 추천(M5)에서 사용. 최근 N일간 사용자가 방문한 식당
import { eq, and, gte, sql, desc } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { parties, partyMembers } from '@/drizzle/schema'
import type { RestaurantVisit } from '../types'

export async function getUserVisitHistory(userId: number, sinceTs: number): Promise<RestaurantVisit[]> {
  const db = getDb()
  const rows = await db
    .select({
      restaurantId: parties.restaurantId,
      lastVisitedAt: sql<number>`MAX(${parties.departAt})`.as('lastVisitedAt'),
      visitCount: sql<number>`COUNT(*)`.as('visitCount'),
    })
    .from(parties)
    .innerJoin(partyMembers, eq(partyMembers.partyId, parties.id))
    .where(
      and(
        eq(partyMembers.userId, userId),
        gte(parties.departAt, sinceTs),
        sql`${parties.restaurantId} IS NOT NULL`
      )
    )
    .groupBy(parties.restaurantId)
    .orderBy(desc(sql`MAX(${parties.departAt})`))

  return rows
    .filter((r): r is { restaurantId: number; lastVisitedAt: number; visitCount: number } =>
      typeof r.restaurantId === 'number'
    )
    .map((r) => ({
      restaurantId: r.restaurantId,
      lastVisitedAt: Number(r.lastVisitedAt),
      visitCount: Number(r.visitCount),
    }))
}
