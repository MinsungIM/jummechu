// tagRestaurant 동시성 / I-4 invariant 테스트
// (better-sqlite3 는 동기 driver 라 Promise.all 도 사실상 직렬화되지만,
//  BEGIN IMMEDIATE 트랜잭션 + usage_count 재계산 로직이 정확한지 확인)
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestDb } from '../_helpers/db'
import { makeUser, makeRestaurant } from '../_helpers/factories'
import { tagRestaurant, getPopularTags, getRestaurant } from '@/features/restaurant'
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

describe('tagRestaurant 동시성 (I-4 invariant)', () => {
  it('같은 (식당, 태그) 에 동시 10회 호출 → row 1개, usage_count 정확', async () => {
    const user = await makeUser(_db)
    const r = await makeRestaurant(_db)

    await Promise.all(
      Array.from({ length: 10 }).map(() => tagRestaurant(r.id, '#가성비', user.id))
    )

    const pop = await getPopularTags(10)
    const tag = pop.find((t) => t.label === '가성비')
    expect(tag).toBeDefined()
    expect(tag!.usageCount).toBe(1)

    const detail = await getRestaurant(r.id)
    expect(detail!.tags.length).toBe(1)
  })

  it('다른 식당 N곳에 같은 태그 동시 → usage_count = N', async () => {
    const user = await makeUser(_db)
    const restaurants = await Promise.all(
      Array.from({ length: 5 }).map((_, i) => makeRestaurant(_db, { name: `R${i}` }))
    )

    await Promise.all(
      restaurants.map((r) => tagRestaurant(r.id, '#매운맛', user.id))
    )

    const pop = await getPopularTags(10)
    const tag = pop.find((t) => t.label === '매운맛')
    expect(tag).toBeDefined()
    expect(tag!.usageCount).toBe(5)
  })
})
