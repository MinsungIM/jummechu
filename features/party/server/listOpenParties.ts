// listOpenParties — Functional Design §3.3
// 오늘의 open 파티만. 정렬·필터 지원. 배치 lazy transition.
import { and, eq, gte, lt, inArray, lte, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { parties, partyMembers, restaurants, restaurantTags } from '@/drizzle/schema'
import { startOfTodayKST, endOfTodayKST } from './_lib/dateRange'
import type { PartyCard, PartyFilter } from '../types'

export async function listOpenParties(filter: PartyFilter = {}): Promise<PartyCard[]> {
  const db = getDb()
  const now = Date.now()
  const todayStart = startOfTodayKST(now)
  const todayEnd = endOfTodayKST(now)

  // 1) 배치 lazy transition: 오늘 범위에서 출발 시각 지난 open → closed
  db.update(parties)
    .set({ status: 'closed' })
    .where(
      and(
        eq(parties.status, 'open'),
        lte(parties.departAt, now),
        gte(parties.departAt, todayStart),
        lt(parties.departAt, todayEnd)
      )
    )
    .run()

  // 2) tagIds 필터: 해시태그 → 식당 매핑 → restaurantId set
  let restaurantIdsByTag: number[] | undefined
  if (filter.tagIds && filter.tagIds.length > 0) {
    try {
      const rows = await db
        .selectDistinct({ rid: restaurantTags.restaurantId })
        .from(restaurantTags)
        .where(inArray(restaurantTags.tagId, filter.tagIds))
      restaurantIdsByTag = rows.map((r) => r.rid)
      if (restaurantIdsByTag.length === 0) return []
    } catch {
      restaurantIdsByTag = undefined // M3 미완성 fallback
    }
  }

  // 3) 본 쿼리
  const whereConds = [
    eq(parties.status, 'open'),
    gte(parties.departAt, todayStart),
    lt(parties.departAt, todayEnd),
  ]
  if (restaurantIdsByTag) whereConds.push(inArray(parties.restaurantId, restaurantIdsByTag))

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
    .where(and(...whereConds))

  // 4) 식당 이름 임베드 (M3 미완성 fallback)
  let restaurantMap = new Map<number, string>()
  const restaurantIds = rows
    .map((r) => r.restaurantId)
    .filter((id): id is number => typeof id === 'number')
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

  // 5) 카드 매핑 + 정렬
  let cards: PartyCard[] = rows.map((r) => ({
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
    tags: [], // sub-batch 후속 단계에서 태그 임베드. T-B 완성 후.
  }))

  // categoryIn 필터: 식당 카테고리 단위. M3 미완성 시 skip.
  // (현재 PartyCard 에 category 필드 없음 → sub-batch 후속에서 확장)

  const sortBy = filter.sortBy ?? 'depart'
  cards.sort((a, b) => {
    switch (sortBy) {
      case 'remaining': {
        const ra = a.capacity - a.currentCount
        const rb = b.capacity - b.currentCount
        if (ra !== rb) return rb - ra
        return a.departAt - b.departAt
      }
      case 'price':
        return (a.priceBand ?? '').localeCompare(b.priceBand ?? '')
      case 'depart':
      case 'category':
      default:
        return a.departAt - b.departAt
    }
  })

  return cards
}
