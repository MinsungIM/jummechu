// T-D 트랙 전용 fixture 팩토리 (rating + recommendation 통합 테스트용)
// T-B(M3) 미구현이라 restaurants/menus 직접 insert
import { restaurants, menus, parties, partyMembers } from '@/drizzle/schema'
import type { Db } from '@/lib/db'

export function makeRestaurant(
  db: Db,
  overrides: Partial<{ name: string; category1: 'kor' | 'chn' | 'jpn' | 'wes' }> = {}
): { id: number; name: string } {
  const name = overrides.name ?? `식당_${Math.random().toString(36).slice(2, 6)}`
  const inserted = db
    .insert(restaurants)
    .values({
      name,
      category1: overrides.category1 ?? null,
      address: null,
      category2: null,
      waitLevel: null,
      reservationRequired: false,
      naverPlaceId: null,
      lat: null,
      lng: null,
      createdAt: Date.now(),
    })
    .returning({ id: restaurants.id, name: restaurants.name })
    .all()
  return inserted[0]!
}

export function makeMenu(
  db: Db,
  restaurantId: number,
  overrides: Partial<{ name: string; price: number | null }> = {}
): { id: number; name: string } {
  const name = overrides.name ?? `메뉴_${Math.random().toString(36).slice(2, 6)}`
  const inserted = db
    .insert(menus)
    .values({
      restaurantId,
      name,
      price: overrides.price ?? null,
      createdAt: Date.now(),
    })
    .returning({ id: menus.id, name: menus.name })
    .all()
  return inserted[0]!
}

// 다녀온 파티 생성 — closed 파티 + (owner, member) 두 명 멤버. departAt 과거.
export function makeRatedParty(
  db: Db,
  ownerId: number,
  memberIds: number[],
  restaurantId: number,
  options: { daysAgo?: number } = {}
): { id: number } {
  const daysAgo = options.daysAgo ?? 1
  const departAt = Date.now() - daysAgo * 24 * 60 * 60 * 1000
  const joinUntil = departAt - 30 * 60 * 1000

  const inserted = db
    .insert(parties)
    .values({
      ownerId,
      name: '점심 모임',
      restaurantId,
      restaurantNameFreetext: null,
      departAt,
      joinUntil,
      place: null,
      priceBand: null,
      capacity: 8,
      rules: null,
      isSilent: false,
      extraSchedule: null,
      notice: null,
      status: 'closed',
      createdAt: departAt - 60 * 60 * 1000,
    })
    .returning({ id: parties.id })
    .all()
  const party = inserted[0]!

  const all = [ownerId, ...memberIds]
  for (const uid of all) {
    db.insert(partyMembers).values({ partyId: party.id, userId: uid, joinedAt: departAt - 30 * 60 * 1000 }).run()
  }
  return party
}
