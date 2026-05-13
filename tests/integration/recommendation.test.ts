// recommendation 통합 테스트 — recent_avoid 필터 + 빈 식당 + satisfaction + popular
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestDb } from '../_helpers/db'
import { makeUser } from '../_helpers/factories'
import { makeRestaurant, makeRatedParty } from '../_helpers/rating-factories'
import {
  recommendForUser,
  getDailySatisfaction,
  listPopularThisWeek,
} from '@/features/recommendation'
import { rateRestaurant, rateMenu } from '@/features/rating'
import { makeMenu } from '../_helpers/rating-factories'
import type { Db } from '@/lib/db'

let _close: () => void
let _db: Db

beforeEach(() => {
  const t = createTestDb()
  _db = t.db
  _close = t.close
})

afterEach(() => {
  _close()
})

describe('recommendForUser', () => {
  it('식당 없음 → 빈 배열 (graceful, M3 미완성 대응)', async () => {
    const u = await makeUser(_db)
    const items = await recommendForUser(u.id, 3)
    expect(items).toEqual([])
  })

  it('최근 7일 방문 식당은 후보에서 제외 (recent_avoid 필터)', async () => {
    const u = await makeUser(_db)
    const rRecent = makeRestaurant(_db, { name: '최근간곳' })
    const rOld1 = makeRestaurant(_db, { name: '안간곳1' })
    const rOld2 = makeRestaurant(_db, { name: '안간곳2' })
    // 최근 1일 전 방문
    makeRatedParty(_db, u.id, [], rRecent.id, { daysAgo: 1 })

    const items = await recommendForUser(u.id, 5)
    const ids = items.map((i) => i.restaurantId)
    expect(ids).not.toContain(rRecent.id)
    expect(ids).toEqual(expect.arrayContaining([rOld1.id, rOld2.id]))
  })

  it('high_rated 풀에서 우선 추출 (avgStars >= 4)', async () => {
    const u = await makeUser(_db)
    const owner = await makeUser(_db)
    // 8일 이상 전 방문이라 recent_avoid 안 걸림
    const rHigh = makeRestaurant(_db, { name: '맛집' })
    const partyHigh = makeRatedParty(_db, owner.id, [], rHigh.id, { daysAgo: 30 })
    await rateRestaurant(owner.id, rHigh.id, partyHigh.id, 5)

    const rUnvisited = makeRestaurant(_db, { name: '미방문' })

    const items = await recommendForUser(u.id, 5)
    expect(items.length).toBeGreaterThan(0)
    expect(items.map((i) => i.restaurantId)).toEqual(
      expect.arrayContaining([rHigh.id, rUnvisited.id])
    )
    const highItem = items.find((i) => i.restaurantId === rHigh.id)
    expect(highItem?.reason).toBe('high_rated')
    const unvItem = items.find((i) => i.restaurantId === rUnvisited.id)
    expect(unvItem?.reason).toBe('unvisited')
  })

  it('limit 만큼만 반환', async () => {
    const u = await makeUser(_db)
    for (let i = 0; i < 10; i++) makeRestaurant(_db, { name: `식당${i}` })
    const items = await recommendForUser(u.id, 3)
    expect(items).toHaveLength(3)
  })
})

describe('getDailySatisfaction', () => {
  it('평가 없음 → null', async () => {
    const u = await makeUser(_db)
    expect(await getDailySatisfaction(u.id)).toBeNull()
  })

  it('최근 7일 식당+메뉴 별점 평균', async () => {
    const u = await makeUser(_db)
    const r = makeRestaurant(_db)
    const m = makeMenu(_db, r.id)
    const party = makeRatedParty(_db, u.id, [], r.id, { daysAgo: 1 })

    await rateRestaurant(u.id, r.id, party.id, 4)
    await rateMenu(u.id, m.id, party.id, 5)

    const sat = await getDailySatisfaction(u.id)
    expect(sat).not.toBeNull()
    expect(sat!.count).toBe(2)
    expect(sat!.avgStars).toBe(4.5)
  })
})

describe('listPopularThisWeek', () => {
  it('count < 2 식당은 노출 안 함', async () => {
    const u1 = await makeUser(_db)
    const r = makeRestaurant(_db, { name: '평가1건만' })
    const party = makeRatedParty(_db, u1.id, [], r.id, { daysAgo: 1 })
    await rateRestaurant(u1.id, r.id, party.id, 5)

    const popular = await listPopularThisWeek()
    expect(popular.map((p) => p.restaurantId)).not.toContain(r.id)
  })

  it('count >= 2 식당은 avgStars 내림차순', async () => {
    const u1 = await makeUser(_db)
    const u2 = await makeUser(_db)
    const u3 = await makeUser(_db)

    const rHigh = makeRestaurant(_db, { name: '5점집' })
    const rMid = makeRestaurant(_db, { name: '3점집' })

    const partyHigh = makeRatedParty(_db, u1.id, [u2.id], rHigh.id, { daysAgo: 1 })
    await rateRestaurant(u1.id, rHigh.id, partyHigh.id, 5)
    await rateRestaurant(u2.id, rHigh.id, partyHigh.id, 5)

    const partyMid = makeRatedParty(_db, u1.id, [u3.id], rMid.id, { daysAgo: 2 })
    await rateRestaurant(u1.id, rMid.id, partyMid.id, 3)
    await rateRestaurant(u3.id, rMid.id, partyMid.id, 3)

    const popular = await listPopularThisWeek()
    expect(popular.map((p) => p.restaurantId)).toEqual([rHigh.id, rMid.id])
  })
})
