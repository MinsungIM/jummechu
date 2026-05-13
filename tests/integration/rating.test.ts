// rating 통합 테스트 — rate upsert + canRate 권한 + stats 계산
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestDb } from '../_helpers/db'
import { makeUser } from '../_helpers/factories'
import { makeRestaurant, makeMenu, makeRatedParty } from '../_helpers/rating-factories'
import {
  rateRestaurant,
  rateMenu,
  getRestaurantRatingStats,
  getMenuRatingStats,
  listMyRatings,
  canRateRestaurant,
  canRateMenu,
  NotEligibleError,
  ValidationError,
} from '@/features/rating'
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

describe('canRateRestaurant', () => {
  it('다녀온 적 없으면 false', async () => {
    const u = await makeUser(_db)
    const r = makeRestaurant(_db)
    expect(await canRateRestaurant(u.id, r.id)).toBe(false)
  })

  it('closed 파티 멤버였으면 true', async () => {
    const owner = await makeUser(_db, { name: '방장' })
    const member = await makeUser(_db, { name: '멤버' })
    const r = makeRestaurant(_db)
    makeRatedParty(_db, owner.id, [member.id], r.id, { daysAgo: 1 })

    expect(await canRateRestaurant(owner.id, r.id)).toBe(true)
    expect(await canRateRestaurant(member.id, r.id)).toBe(true)
  })
})

describe('canRateMenu', () => {
  it('해당 메뉴의 식당을 다녀왔으면 true', async () => {
    const u = await makeUser(_db)
    const r = makeRestaurant(_db)
    const m = makeMenu(_db, r.id)
    makeRatedParty(_db, u.id, [], r.id)
    expect(await canRateMenu(u.id, m.id)).toBe(true)
  })

  it('존재하지 않는 메뉴면 false', async () => {
    const u = await makeUser(_db)
    expect(await canRateMenu(u.id, 9999)).toBe(false)
  })
})

describe('rateRestaurant upsert', () => {
  it('첫 평가 INSERT → 같은 user+restaurant 재평가 시 UPDATE (1행 유지)', async () => {
    const u = await makeUser(_db)
    const r = makeRestaurant(_db)
    const party = makeRatedParty(_db, u.id, [], r.id)

    const first = await rateRestaurant(u.id, r.id, party.id, 3, undefined, ['#가성비'])
    expect(first.stars).toBe(3)
    expect(first.tagLabels).toEqual(['#가성비'])

    const second = await rateRestaurant(u.id, r.id, party.id, 5, undefined, ['#대박'])
    expect(second.id).toBe(first.id)
    expect(second.stars).toBe(5)
    expect(second.tagLabels).toEqual(['#대박'])

    const stats = await getRestaurantRatingStats(r.id)
    expect(stats.count).toBe(1) // 1행만 유지됨
    expect(stats.avgStars).toBe(5)
  })

  it('NOT_ELIGIBLE: 다녀온 적 없는 식당 평가 시도', async () => {
    const u = await makeUser(_db)
    const r = makeRestaurant(_db)
    await expect(rateRestaurant(u.id, r.id, 999, 5)).rejects.toBeInstanceOf(NotEligibleError)
  })

  it('VALIDATION_ERROR: stars 범위 밖', async () => {
    const u = await makeUser(_db)
    const r = makeRestaurant(_db)
    const party = makeRatedParty(_db, u.id, [], r.id)
    await expect(rateRestaurant(u.id, r.id, party.id, 6)).rejects.toBeInstanceOf(ValidationError)
    await expect(rateRestaurant(u.id, r.id, party.id, 0)).rejects.toBeInstanceOf(ValidationError)
  })

  it('VALIDATION_ERROR: tagLabels 라벨 길이 초과', async () => {
    const u = await makeUser(_db)
    const r = makeRestaurant(_db)
    const party = makeRatedParty(_db, u.id, [], r.id)
    await expect(rateRestaurant(u.id, r.id, party.id, 3, undefined, ['a'.repeat(31)])).rejects.toBeInstanceOf(
      ValidationError
    )
  })
})

describe('rateMenu upsert', () => {
  it('같은 user+menu 재평가 → 1행 유지', async () => {
    const u = await makeUser(_db)
    const r = makeRestaurant(_db)
    const m = makeMenu(_db, r.id)
    const party = makeRatedParty(_db, u.id, [], r.id)

    const first = await rateMenu(u.id, m.id, party.id, 4, '괜찮음')
    const second = await rateMenu(u.id, m.id, party.id, 5, '진짜 맛있어졌어요')
    expect(second.id).toBe(first.id)

    const stats = await getMenuRatingStats(m.id)
    expect(stats.count).toBe(1)
    expect(stats.avgStars).toBe(5)
  })

  it('VALIDATION_ERROR: 메뉴 stars 필수', async () => {
    const u = await makeUser(_db)
    const r = makeRestaurant(_db)
    const m = makeMenu(_db, r.id)
    const party = makeRatedParty(_db, u.id, [], r.id)
    // @ts-expect-error stars 미제공 케이스
    await expect(rateMenu(u.id, m.id, party.id)).rejects.toBeInstanceOf(ValidationError)
  })

  it('VALIDATION_ERROR: comment 200자 초과', async () => {
    const u = await makeUser(_db)
    const r = makeRestaurant(_db)
    const m = makeMenu(_db, r.id)
    const party = makeRatedParty(_db, u.id, [], r.id)
    await expect(rateMenu(u.id, m.id, party.id, 5, 'a'.repeat(201))).rejects.toBeInstanceOf(ValidationError)
  })
})

describe('getRestaurantRatingStats', () => {
  it('빈 식당 → avgStars 0, count 0, tagFrequency []', async () => {
    const r = makeRestaurant(_db)
    const stats = await getRestaurantRatingStats(r.id)
    expect(stats).toEqual({ restaurantId: r.id, avgStars: 0, count: 0, tagFrequency: [] })
  })

  it('여러 평가 + 태그 빈도 집계', async () => {
    const owner = await makeUser(_db)
    const u2 = await makeUser(_db)
    const u3 = await makeUser(_db)
    const r = makeRestaurant(_db)
    const party = makeRatedParty(_db, owner.id, [u2.id, u3.id], r.id)

    await rateRestaurant(owner.id, r.id, party.id, 4, undefined, ['#가성비', '#양많음'])
    await rateRestaurant(u2.id, r.id, party.id, 5, undefined, ['#가성비'])
    await rateRestaurant(u3.id, r.id, party.id, 3, undefined, ['#대기길다'])

    const stats = await getRestaurantRatingStats(r.id)
    expect(stats.count).toBe(3)
    expect(stats.avgStars).toBe(4) // (4+5+3)/3
    const gasung = stats.tagFrequency.find((t) => t.tagLabel === '#가성비')
    expect(gasung?.count).toBe(2)
    expect(stats.tagFrequency[0]?.tagLabel).toBe('#가성비') // 가장 빈도 높음
  })
})

describe('listMyRatings', () => {
  it('식당+메뉴 평가 분리해서 반환', async () => {
    const u = await makeUser(_db)
    const r = makeRestaurant(_db)
    const m = makeMenu(_db, r.id)
    const party = makeRatedParty(_db, u.id, [], r.id)

    await rateRestaurant(u.id, r.id, party.id, 5)
    await rateMenu(u.id, m.id, party.id, 4, 'good')

    const my = await listMyRatings(u.id)
    expect(my.restaurants).toHaveLength(1)
    expect(my.menus).toHaveLength(1)
    expect(my.restaurants[0]!.stars).toBe(5)
    expect(my.menus[0]!.comment).toBe('good')
  })
})
