// Write path 통합 테스트 — joinParty/leaveParty 동시성 invariant 포함
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestDb } from '../_helpers/db'
import { makeUser, inMinutes } from '../_helpers/factories'
import { createParty } from '@/features/party/server/createParty'
import { joinParty } from '@/features/party/server/joinParty'
import { leaveParty } from '@/features/party/server/leaveParty'
import { getParty } from '@/features/party/server/getParty'
import {
  AlreadyMemberError,
  CapacityFullError,
  JoinUntilPassedError,
  PartyClosedError,
  NotMemberError,
  OwnerCannotLeaveError,
} from '@/features/party/server/_lib/errors'
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

describe('joinParty 기본', () => {
  it('비회원이 합류 → currentCount 증가', async () => {
    const owner = await makeUser(_db, { name: '방장' })
    const guest = await makeUser(_db, { name: '손님' })
    const party = await createParty(owner.id, {
      name: '점심',
      restaurantId: null,
      restaurantNameFreetext: '국밥',
      departAt: inMinutes(60),
      joinUntil: inMinutes(30),
      place: null,
      priceBand: null,
      capacity: 4,
    })

    await joinParty(party.id, guest.id)
    const detail = await getParty(party.id)
    expect(detail!.currentCount).toBe(2)
    expect(detail!.members.map((m) => m.id).sort()).toEqual([owner.id, guest.id].sort())
  })

  it('이미 멤버이면 AlreadyMemberError', async () => {
    const owner = await makeUser(_db)
    const party = await createParty(owner.id, {
      name: '점심',
      restaurantId: null,
      restaurantNameFreetext: '국밥',
      departAt: inMinutes(60),
      joinUntil: inMinutes(30),
      place: null,
      priceBand: null,
      capacity: 4,
    })
    await expect(joinParty(party.id, owner.id)).rejects.toBeInstanceOf(AlreadyMemberError)
  })

  it('joinUntil 지남 → JoinUntilPassedError', async () => {
    const owner = await makeUser(_db)
    const guest = await makeUser(_db)
    const party = await createParty(owner.id, {
      name: '점심',
      restaurantId: null,
      restaurantNameFreetext: '국밥',
      departAt: Date.now() + 60 * 60 * 1000,
      joinUntil: Date.now() + 60 * 1000, // 1분 후
      place: null,
      priceBand: null,
      capacity: 4,
    })
    // joinUntil 직접 과거로 갱신
    const db = _db
    const { parties } = await import('@/drizzle/schema')
    const { eq } = await import('drizzle-orm')
    db.update(parties).set({ joinUntil: Date.now() - 60 * 1000 }).where(eq(parties.id, party.id)).run()

    await expect(joinParty(party.id, guest.id)).rejects.toBeInstanceOf(JoinUntilPassedError)
  })
})

describe('joinParty ⭐ 동시성 invariant', () => {
  it('capacity=3, 10명 동시 합류 → 정확히 2 성공 + 8 PARTY_FULL (owner는 이미 1 차지)', async () => {
    const owner = await makeUser(_db, { name: '방장' })
    const party = await createParty(owner.id, {
      name: '점심',
      restaurantId: null,
      restaurantNameFreetext: '국밥',
      departAt: inMinutes(60),
      joinUntil: inMinutes(30),
      place: null,
      priceBand: null,
      capacity: 3,
    })
    // owner 이미 1 멤버. 나머지 2자리.

    const guests = await Promise.all(
      Array.from({ length: 10 }, (_, i) => makeUser(_db, { name: `g${i}` }))
    )

    const results = await Promise.allSettled(guests.map((g) => joinParty(party.id, g.id)))
    const success = results.filter((r) => r.status === 'fulfilled').length
    const full = results.filter(
      (r) => r.status === 'rejected' && r.reason instanceof CapacityFullError
    ).length
    expect(success).toBe(2)
    expect(full).toBe(8)

    const detail = await getParty(party.id)
    expect(detail!.currentCount).toBe(3)
  })
})

describe('leaveParty', () => {
  it('일반 멤버는 leave 가능', async () => {
    const owner = await makeUser(_db)
    const guest = await makeUser(_db)
    const party = await createParty(owner.id, {
      name: '점심',
      restaurantId: null,
      restaurantNameFreetext: '국밥',
      departAt: inMinutes(60),
      joinUntil: inMinutes(30),
      place: null,
      priceBand: null,
      capacity: 4,
    })
    await joinParty(party.id, guest.id)
    await leaveParty(party.id, guest.id)
    const detail = await getParty(party.id)
    expect(detail!.currentCount).toBe(1)
    expect(detail!.members.map((m) => m.id)).toEqual([owner.id])
  })

  it('owner는 leave 불가 (OwnerCannotLeaveError)', async () => {
    const owner = await makeUser(_db)
    const party = await createParty(owner.id, {
      name: '점심',
      restaurantId: null,
      restaurantNameFreetext: '국밥',
      departAt: inMinutes(60),
      joinUntil: inMinutes(30),
      place: null,
      priceBand: null,
      capacity: 4,
    })
    await expect(leaveParty(party.id, owner.id)).rejects.toBeInstanceOf(OwnerCannotLeaveError)
  })

  it('비멤버 leave → NotMemberError', async () => {
    const owner = await makeUser(_db)
    const stranger = await makeUser(_db)
    const party = await createParty(owner.id, {
      name: '점심',
      restaurantId: null,
      restaurantNameFreetext: '국밥',
      departAt: inMinutes(60),
      joinUntil: inMinutes(30),
      place: null,
      priceBand: null,
      capacity: 4,
    })
    await expect(leaveParty(party.id, stranger.id)).rejects.toBeInstanceOf(NotMemberError)
  })

  it('cancelled 파티 leave 불가', async () => {
    const owner = await makeUser(_db)
    const guest = await makeUser(_db)
    const party = await createParty(owner.id, {
      name: '점심',
      restaurantId: null,
      restaurantNameFreetext: '국밥',
      departAt: inMinutes(60),
      joinUntil: inMinutes(30),
      place: null,
      priceBand: null,
      capacity: 4,
    })
    await joinParty(party.id, guest.id)
    const { parties } = await import('@/drizzle/schema')
    const { eq } = await import('drizzle-orm')
    _db.update(parties).set({ status: 'cancelled' }).where(eq(parties.id, party.id)).run()
    await expect(leaveParty(party.id, guest.id)).rejects.toBeInstanceOf(PartyClosedError)
  })
})
