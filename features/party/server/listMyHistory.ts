// listMyHistory — 내가 참여한 closed/cancelled 파티 목록
import { eq, desc, inArray, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { parties, partyMembers, restaurants } from '@/drizzle/schema'
import type { HistoryItem } from '../types'

export async function listMyHistory(userId: number): Promise<HistoryItem[]> {
  const db = getDb()

  const rows = await db
    .select({
      id: parties.id,
      name: parties.name,
      departAt: parties.departAt,
      restaurantId: parties.restaurantId,
      restaurantNameFreetext: parties.restaurantNameFreetext,
      memberCount: sql<number>`(
        SELECT COUNT(*) FROM ${partyMembers}
        WHERE ${partyMembers.partyId} = ${parties.id}
      )`.as('memberCount'),
    })
    .from(parties)
    .innerJoin(partyMembers, eq(partyMembers.partyId, parties.id))
    .where(eq(partyMembers.userId, userId))
    .orderBy(desc(parties.departAt))

  // closed/cancelled 만 포함 (open 은 listMyOpenParties)
  const filtered = rows
    .filter(() => true) // 상태 필터는 별도 status 필드 join 필요 — 아래에서 재조회
    .slice() // 복사
  // status 가져오기 (위 SELECT 누락) — 재 query 단순화
  const ids = filtered.map((r) => r.id)
  if (ids.length === 0) return []

  const statusRows = await db
    .select({ id: parties.id, status: parties.status })
    .from(parties)
    .where(inArray(parties.id, ids))
  const statusMap = new Map(statusRows.map((s) => [s.id, s.status]))

  const restaurantIds = filtered
    .map((r) => r.restaurantId)
    .filter((id): id is number => typeof id === 'number')
  let restaurantMap = new Map<number, string>()
  if (restaurantIds.length > 0) {
    try {
      const restRows = await db
        .select({ id: restaurants.id, name: restaurants.name })
        .from(restaurants)
        .where(inArray(restaurants.id, restaurantIds))
      restaurantMap = new Map(restRows.map((r) => [r.id, r.name]))
    } catch {
      restaurantMap = new Map()
    }
  }

  return filtered
    .filter((r) => statusMap.get(r.id) !== 'open')
    .map((r) => ({
      id: r.id,
      name: r.name,
      departAt: r.departAt,
      restaurantId: r.restaurantId,
      restaurantName:
        (r.restaurantId !== null && restaurantMap.get(r.restaurantId)) ||
        r.restaurantNameFreetext ||
        null,
      memberCount: Number(r.memberCount ?? 0),
    }))
}
