// M6 map 통합 테스트 — M3 getAllRestaurantsForMap 과 결합
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestDb } from '../_helpers/db'
import { makeRestaurant } from '../_helpers/factories'
import { getAllRestaurantsForMap } from '@/features/restaurant'
import { buildNaverDirectionsUrl } from '@/features/map'
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

describe('getAllRestaurantsForMap → buildNaverDirectionsUrl 통합', () => {
  it('지도 마커 데이터로 길찾기 URL 을 생성할 수 있다', async () => {
    await makeRestaurant(_db, { name: '국밥집', lat: 37.55, lng: 126.99, category1: 'kor' })
    await makeRestaurant(_db, { name: '라멘집', lat: 37.56, lng: 127.0, category1: 'jpn' })
    // 위경도 미등록 식당 → markers 에는 있지만 빌드 시 검색 URL fallback
    await makeRestaurant(_db, { name: '미스터리', lat: null, lng: null })

    const markers = await getAllRestaurantsForMap()
    expect(markers.length).toBe(3)

    for (const m of markers) {
      const url = buildNaverDirectionsUrl(
        'current',
        m.lat ?? Number.NaN,
        m.lng ?? Number.NaN,
        m.name
      )
      expect(url.startsWith('https://map.naver.com/')).toBe(true)
    }
  })
})
