// M3 restaurant Write path 통합 테스트
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestDb } from '../_helpers/db'
import { makeUser, makeRestaurant } from '../_helpers/factories'
import {
  addMenu,
  tagRestaurant,
  getRestaurant,
  getPopularTags,
  RestaurantNotFoundError,
  ValidationError,
} from '@/features/restaurant'
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

describe('addMenu', () => {
  it('식당이 없으면 RestaurantNotFoundError', async () => {
    await expect(addMenu(9999, '국밥', 8000)).rejects.toBeInstanceOf(RestaurantNotFoundError)
  })

  it('빈 메뉴명은 ValidationError', async () => {
    const r = await makeRestaurant(_db)
    await expect(addMenu(r.id, '   ', 5000)).rejects.toBeInstanceOf(ValidationError)
  })

  it('음수 가격은 ValidationError', async () => {
    const r = await makeRestaurant(_db)
    await expect(addMenu(r.id, '메뉴', -100)).rejects.toBeInstanceOf(ValidationError)
  })

  it('가격 null 은 허용된다', async () => {
    const r = await makeRestaurant(_db)
    const menu = await addMenu(r.id, '오마카세', null)
    expect(menu.price).toBeNull()
    expect(menu.name).toBe('오마카세')
  })
})

describe('tagRestaurant — 정규화·멱등·usage_count invariant', () => {
  it('새 태그가 만들어지고 usage_count = 1', async () => {
    const user = await makeUser(_db)
    const r = await makeRestaurant(_db)
    await tagRestaurant(r.id, '#가성비', user.id)
    const pop = await getPopularTags(10)
    const t = pop.find((x) => x.label === '가성비')
    expect(t).toBeDefined()
    expect(t!.usageCount).toBe(1)

    const detail = await getRestaurant(r.id)
    expect(detail!.tags.map((x) => x.label)).toEqual(['가성비'])
  })

  it('같은 식당에 같은 태그를 여러 번 → 멱등 (usage_count=1, row=1)', async () => {
    const user = await makeUser(_db)
    const r = await makeRestaurant(_db)
    await tagRestaurant(r.id, '#가성비', user.id)
    await tagRestaurant(r.id, '가성비', user.id) // 정규화 후 동일
    await tagRestaurant(r.id, ' 가성비 ', user.id)

    const pop = await getPopularTags(10)
    const t = pop.find((x) => x.label === '가성비')
    expect(t!.usageCount).toBe(1)

    const detail = await getRestaurant(r.id)
    expect(detail!.tags.length).toBe(1)
  })

  it('다른 식당이 같은 태그 → usage_count 누적', async () => {
    const user = await makeUser(_db)
    const r1 = await makeRestaurant(_db, { name: 'A' })
    const r2 = await makeRestaurant(_db, { name: 'B' })
    const r3 = await makeRestaurant(_db, { name: 'C' })
    await tagRestaurant(r1.id, '#가성비', user.id)
    await tagRestaurant(r2.id, '#가성비', user.id)
    await tagRestaurant(r3.id, '#가성비', user.id)

    const pop = await getPopularTags(10)
    expect(pop.find((x) => x.label === '가성비')!.usageCount).toBe(3)
  })

  it('식당이 없으면 RestaurantNotFoundError', async () => {
    const user = await makeUser(_db)
    await expect(tagRestaurant(9999, '#가성비', user.id)).rejects.toBeInstanceOf(
      RestaurantNotFoundError
    )
  })

  it('빈 태그는 ValidationError', async () => {
    const user = await makeUser(_db)
    const r = await makeRestaurant(_db)
    await expect(tagRestaurant(r.id, '   ', user.id)).rejects.toBeInstanceOf(ValidationError)
    await expect(tagRestaurant(r.id, '#', user.id)).rejects.toBeInstanceOf(ValidationError)
  })
})
