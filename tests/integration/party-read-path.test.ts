// Read path 통합 테스트 — in-memory SQLite + drizzle 마이그레이션
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createTestDb } from '../_helpers/db'
import { makeUser, inMinutes } from '../_helpers/factories'
import { createParty } from '@/features/party/server/createParty'
import { getParty } from '@/features/party/server/getParty'
import { listOpenParties } from '@/features/party/server/listOpenParties'
import type { Db } from '@/lib/db'

let _close: () => void
let _db: Db

beforeEach(() => {
  const t = createTestDb()
  _db = t.db
  _close = t.close
})

afterEach(() => {
  vi.useRealTimers()
  _close()
})

describe('createParty + getParty 라운드트립', () => {
  it('owner 가 멤버로 자동 등록되며 currentCount=1', async () => {
    const owner = await makeUser(_db, { name: '방장' })
    const created = await createParty(owner.id, {
      name: '점심 1',
      restaurantId: null,
      restaurantNameFreetext: '김밥천국',
      departAt: inMinutes(60),
      joinUntil: inMinutes(30),
      place: '로비',
      priceBand: '1만원대',
      capacity: 4,
    })

    const detail = await getParty(created.id)
    expect(detail).not.toBeNull()
    expect(detail!.ownerId).toBe(owner.id)
    expect(detail!.currentCount).toBe(1)
    expect(detail!.members[0]?.id).toBe(owner.id)
    expect(detail!.status).toBe('open')
  })
})

describe('getParty lazy transition', () => {
  it('출발 시각 지난 open 파티는 closed 로 갱신', async () => {
    const owner = await makeUser(_db)
    const fixedNow = Date.UTC(2026, 4, 13, 0, 0, 0) // 2026-05-13 00:00 UTC
    vi.setSystemTime(fixedNow)
    const created = await createParty(owner.id, {
      name: '곧 출발',
      restaurantId: null,
      restaurantNameFreetext: '국밥집',
      departAt: fixedNow + 60 * 60 * 1000,
      joinUntil: fixedNow + 30 * 60 * 1000,
      place: null,
      priceBand: null,
      capacity: 3,
    })

    // 출발 시각 직후 시점
    vi.setSystemTime(fixedNow + 2 * 60 * 60 * 1000)
    const detail = await getParty(created.id)
    expect(detail!.status).toBe('closed')
  })
})

describe('listOpenParties 정렬·필터', () => {
  it('depart asc 기본 정렬', async () => {
    const owner = await makeUser(_db)
    const fixedNow = Date.UTC(2026, 4, 13, 1, 0, 0) // KST 10시
    vi.setSystemTime(fixedNow)
    const a = await createParty(owner.id, {
      name: 'A',
      restaurantId: null,
      restaurantNameFreetext: '김밥',
      departAt: fixedNow + 3 * 60 * 60 * 1000,
      joinUntil: fixedNow + 2 * 60 * 60 * 1000,
      place: null,
      priceBand: null,
      capacity: 4,
    })
    const b = await createParty(owner.id, {
      name: 'B',
      restaurantId: null,
      restaurantNameFreetext: '국밥',
      departAt: fixedNow + 90 * 60 * 1000,
      joinUntil: fixedNow + 60 * 60 * 1000,
      place: null,
      priceBand: null,
      capacity: 4,
    })

    const list = await listOpenParties({})
    const ids = list.map((p) => p.id)
    expect(ids).toEqual([b.id, a.id])
  })

  it('빈 결과 처리', async () => {
    const list = await listOpenParties({})
    expect(list).toEqual([])
  })

  it('remaining desc 정렬 — 자리 많이 남은 순', async () => {
    const owner = await makeUser(_db)
    const fixedNow = Date.UTC(2026, 4, 13, 1, 0, 0)
    vi.setSystemTime(fixedNow)
    // capacity=4, owner1명 → remaining=3
    const a = await createParty(owner.id, {
      name: '많음',
      restaurantId: null,
      restaurantNameFreetext: 'A',
      departAt: fixedNow + 4 * 60 * 60 * 1000,
      joinUntil: fixedNow + 3 * 60 * 60 * 1000,
      place: null,
      priceBand: null,
      capacity: 4,
    })
    const b = await createParty(owner.id, {
      name: '적음',
      restaurantId: null,
      restaurantNameFreetext: 'B',
      departAt: fixedNow + 5 * 60 * 60 * 1000,
      joinUntil: fixedNow + 4 * 60 * 60 * 1000,
      place: null,
      priceBand: null,
      capacity: 2,
    })

    const list = await listOpenParties({ sortBy: 'remaining' })
    expect(list.map((p) => p.id)).toEqual([a.id, b.id])
  })
})
