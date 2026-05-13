// getParty — Functional Design §3.2
// SELECT + lazy transition (status='open' AND departAt <= now → UPDATE 'closed') + 멤버/식당 JOIN
import { eq, and, lte } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { parties, partyMembers, users, restaurants } from '@/drizzle/schema'
import type { PartyDetail } from '../types'

export async function getParty(id: number): Promise<PartyDetail | null> {
  const db = getDb()

  // 1) Lazy transition: 출발 시각 지난 open 파티는 closed 로 갱신
  const now = Date.now()
  db.update(parties)
    .set({ status: 'closed' })
    .where(and(eq(parties.id, id), eq(parties.status, 'open'), lte(parties.departAt, now)))
    .run()

  // 2) 파티 본체
  const partyRows = await db.select().from(parties).where(eq(parties.id, id)).limit(1)
  const party = partyRows[0]
  if (!party) return null

  // 3) 멤버 목록 (joined users)
  const memberRows = await db
    .select({ id: users.id, name: users.name, joinedAt: partyMembers.joinedAt })
    .from(partyMembers)
    .innerJoin(users, eq(users.id, partyMembers.userId))
    .where(eq(partyMembers.partyId, id))

  // 4) 식당 임베드 (M3 미완성 시 null fallback)
  let restaurant: { id: number; name: string } | null = null
  if (party.restaurantId) {
    try {
      const rows = await db
        .select({ id: restaurants.id, name: restaurants.name })
        .from(restaurants)
        .where(eq(restaurants.id, party.restaurantId))
        .limit(1)
      restaurant = rows[0] ?? null
    } catch {
      restaurant = null
    }
  }

  return {
    id: party.id,
    ownerId: party.ownerId,
    name: party.name,
    restaurantId: party.restaurantId,
    restaurantNameFreetext: party.restaurantNameFreetext ?? undefined,
    departAt: party.departAt,
    joinUntil: party.joinUntil,
    place: party.place,
    priceBand: party.priceBand,
    capacity: party.capacity,
    rules: party.rules ?? undefined,
    isSilent: party.isSilent,
    extraSchedule: party.extraSchedule ?? undefined,
    status: party.status,
    createdAt: party.createdAt,
    notice: party.notice,
    currentCount: memberRows.length,
    members: memberRows.map((m) => ({ id: m.id, name: m.name })),
    restaurant,
  }
}
