// M3 restaurant Read path 통합 테스트
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestDb } from '../_helpers/db'
import { makeUser, makeRestaurant } from '../_helpers/factories'
import {
  getRestaurant,
  getRestaurantSummary,
  getMenusByRestaurant,
  listRestaurantsByTags,
  searchRestaurantsByTag,
  suggestTags,
  getPopularTags,
  getAllRestaurantsForMap,
  addMenu,
  tagRestaurant,
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

describe('getRestaurantSummary (M2 호환)', () => {
  it('id/name/category1/lat/lng 필드만 반환', async () => {
    const r = await makeRestaurant(_db, {
      name: '국밥집',
      category1: 'kor',
      lat: 37.5,
      lng: 127,
      address: '서울 어딘가',
    })
    const summary = await getRestaurantSummary(r.id)
    expect(summary).not.toBeNull()
    expect(summary).toEqual({
      id: r.id,
      name: '국밥집',
      category1: 'kor',
      lat: 37.5,
      lng: 127,
    })
    // address 등 다른 필드는 포함되지 않음
    expect(Object.keys(summary!).sort()).toEqual(['category1', 'id', 'lat', 'lng', 'name'])
  })

  it('미존재 id → null', async () => {
    expect(await getRestaurantSummary(9999)).toBeNull()
  })
})

describe('getRestaurant + tags JOIN', () => {
  it('tags 가 함께 채워진다', async () => {
    const user = await makeUser(_db)
    const r = await makeRestaurant(_db, { name: '돈까스집' })
    await tagRestaurant(r.id, '#가성비', user.id)
    await tagRestaurant(r.id, '#회식하기좋음', user.id)

    const detail = await getRestaurant(r.id)
    expect(detail).not.toBeNull()
    expect(detail!.tags.map((t) => t.label).sort()).toEqual(['가성비', '회식하기좋음'])
  })

  it('미존재 id → null', async () => {
    expect(await getRestaurant(9999)).toBeNull()
  })
})

describe('getMenusByRestaurant + addMenu', () => {
  it('메뉴 추가 후 최신순으로 조회된다', async () => {
    const r = await makeRestaurant(_db, { name: '분식집' })
    const m1 = await addMenu(r.id, '떡볶이', 5000)
    // 시간차 보장
    await new Promise((res) => setTimeout(res, 5))
    const m2 = await addMenu(r.id, '순대', 4000)

    const menus = await getMenusByRestaurant(r.id)
    expect(menus.length).toBe(2)
    // createdAt DESC → 최근 추가가 먼저
    expect(menus[0]?.id).toBe(m2.id)
    expect(menus[1]?.id).toBe(m1.id)
  })

  it('가격 null 도 허용된다', async () => {
    const r = await makeRestaurant(_db)
    const menu = await addMenu(r.id, '시그니처 메뉴', null)
    expect(menu.price).toBeNull()
  })
})

describe('listRestaurantsByTags AND 시맨틱', () => {
  it('빈 배열 입력 → 전체 식당', async () => {
    await makeRestaurant(_db, { name: 'A' })
    await makeRestaurant(_db, { name: 'B' })
    const list = await listRestaurantsByTags([])
    expect(list.length).toBe(2)
  })

  it('여러 태그 입력 시 모두 가진 식당만 통과 (AND)', async () => {
    const user = await makeUser(_db)
    const a = await makeRestaurant(_db, { name: 'A' })
    const b = await makeRestaurant(_db, { name: 'B' })

    await tagRestaurant(a.id, '#가성비', user.id)
    await tagRestaurant(a.id, '#매운맛', user.id)
    await tagRestaurant(b.id, '#가성비', user.id)
    // B 는 매운맛 없음

    // 두 태그 id 모두 가진 식당 = A 만
    const popular = await getPopularTags(10)
    const tag가성비 = popular.find((t) => t.label === '가성비')
    const tag매운맛 = popular.find((t) => t.label === '매운맛')
    expect(tag가성비).toBeDefined()
    expect(tag매운맛).toBeDefined()

    const matched = await listRestaurantsByTags([tag가성비!.id, tag매운맛!.id])
    expect(matched.map((r) => r.id)).toEqual([a.id])
  })
})

describe('searchRestaurantsByTag (정규화 후 검색)', () => {
  it('정규화된 라벨로 식당을 찾는다', async () => {
    const user = await makeUser(_db)
    const r = await makeRestaurant(_db, { name: '카페' })
    await tagRestaurant(r.id, ' #가성비 ', user.id)

    const r1 = await searchRestaurantsByTag('#가성비')
    const r2 = await searchRestaurantsByTag('가성비')
    const r3 = await searchRestaurantsByTag('  가성비  ')
    expect(r1.map((x) => x.id)).toEqual([r.id])
    expect(r2.map((x) => x.id)).toEqual([r.id])
    expect(r3.map((x) => x.id)).toEqual([r.id])
  })

  it('미존재 태그 → 빈 배열', async () => {
    expect(await searchRestaurantsByTag('미존재태그')).toEqual([])
  })
})

describe('suggestTags / getPopularTags', () => {
  it('prefix 로 시작하는 태그를 usage_count 내림차순으로 반환', async () => {
    const user = await makeUser(_db)
    const a = await makeRestaurant(_db, { name: 'A' })
    const b = await makeRestaurant(_db, { name: 'B' })
    // '가성비' 2회, '가족모임' 1회
    await tagRestaurant(a.id, '#가성비', user.id)
    await tagRestaurant(b.id, '#가성비', user.id)
    await tagRestaurant(a.id, '#가족모임', user.id)

    const suggestions = await suggestTags('가')
    expect(suggestions.length).toBe(2)
    expect(suggestions[0]?.label).toBe('가성비')
    expect(suggestions[0]?.usageCount).toBe(2)
    expect(suggestions[1]?.label).toBe('가족모임')
    expect(suggestions[1]?.usageCount).toBe(1)
  })

  it('빈 prefix → getPopularTags fallback', async () => {
    const user = await makeUser(_db)
    const a = await makeRestaurant(_db, { name: 'A' })
    await tagRestaurant(a.id, '#매운맛', user.id)
    const result = await suggestTags('')
    expect(result.map((t) => t.label)).toContain('매운맛')
  })
})

describe('getAllRestaurantsForMap', () => {
  it('avgRating 은 항상 null 로 채워진다 (M4 미완성)', async () => {
    await makeRestaurant(_db, { name: 'A', lat: 37.5, lng: 127 })
    await makeRestaurant(_db, { name: 'B', lat: 37.6, lng: 127.1 })
    const markers = await getAllRestaurantsForMap()
    expect(markers.length).toBe(2)
    for (const m of markers) {
      expect(m.avgRating).toBeNull()
    }
  })
})
