// listMyOpenParties — 내가 멤버인 open 상태 파티 (오늘의 일정 표시용)
import { eq, and, inArray, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { parties, partyMembers, restaurants } from '@/drizzle/schema'
import type { PartyCard } from '../types'

export async function listMyOpenParties(userId: number): Promise<PartyCard[]> {
  const db = getDb()
  const rows = await db
    .select({
      id: parties.id,
      name: parties.name,
      departAt: parties.departAt,
      capacity: parties.capacity,
      priceBand: parties.priceBand,
      isSilent: parties.isSilent,
      restaurantId: parties.restaurantId,
      restaurantNameFreetext: parties.restaurantNameFreetext,
      currentCount: sql<number>`(
        SELECT COUNT(*) FROM ${partyMembers}
        WHERE ${partyMembers.partyId} = ${parties.id}
      )`.as('currentCount'),
    })
    .from(parties)
    .innerJoin(partyMembers, eq(partyMembers.partyId, parties.id))
    .where(and(eq(partyMembers.userId, userId), eq(parties.status, 'open')))

  const restaurantIds = rows
    .map((r) => r.restaurantId)
    .filter((id): id is number => typeof id === 'number')
  let restaurantMap = new Map<number, string>()
  if (restaurantIds.length > 0) {
    const restRows = await db
      .select({ id: restaurants.id, name: restaurants.name })
      .from(restaurants)
      .where(inArray(restaurants.id, restaurantIds))
    restaurantMap = new Map(restRows.map((r) => [r.id, r.name]))
  }

  return rows
    .map<PartyCard>((r) => ({
      id: r.id,
      name: r.name,
      departAt: r.departAt,
      capacity: r.capacity,
      priceBand: r.priceBand,
      isSilent: r.isSilent,
      currentCount: Number(r.currentCount ?? 0),
      restaurantName:
        (r.restaurantId !== null && restaurantMap.get(r.restaurantId)) ||
        r.restaurantNameFreetext ||
        null,
      tags: [],
    }))
    .sort((a, b) => a.departAt - b.departAt)
}
