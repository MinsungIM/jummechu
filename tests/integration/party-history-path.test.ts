// History + extras 통합 테스트
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestDb } from '../_helpers/db'
import { makeUser, inMinutes } from '../_helpers/factories'
import { createParty } from '@/features/party/server/createParty'
import { joinParty } from '@/features/party/server/joinParty'
import { setNotice } from '@/features/party/server/setNotice'
import { cancelParty } from '@/features/party/server/cancelParty'
import { listMyHistory } from '@/features/party/server/listMyHistory'
import { listMyOpenParties } from '@/features/party/server/listMyOpenParties'
import { getPartyForReclone } from '@/features/party/server/getPartyForReclone'
import { getUserVisitHistory } from '@/features/party/server/getUserVisitHistory'
import { getParty } from '@/features/party/server/getParty'
import {
  NotOwnerError,
  PartyClosedError,
  ValidationError,
  PartyNotFoundError,
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

const makeBaseInput = () => ({
  name: '점심',
  restaurantId: null,
  restaurantNameFreetext: '국밥',
  departAt: inMinutes(60),
  joinUntil: inMinutes(30),
  place: null,
  priceBand: null,
  capacity: 4,
})

describe('setNotice', () => {
  it('owner 가 공지 설정 가능', async () => {
    const owner = await makeUser(_db)
    const party = await createParty(owner.id, makeBaseInput())
    await setNotice(party.id, owner.id, '늦지 마세요')
    const detail = await getParty(party.id)
    expect(detail!.notice).toBe('늦지 마세요')
  })

  it('owner 가 아니면 NotOwnerError', async () => {
    const owner = await makeUser(_db)
    const stranger = await makeUser(_db)
    const party = await createParty(owner.id, makeBaseInput())
    await expect(setNotice(party.id, stranger.id, '시도')).rejects.toBeInstanceOf(NotOwnerError)
  })

  it('500자 초과는 ValidationError', async () => {
    const owner = await makeUser(_db)
    const party = await createParty(owner.id, makeBaseInput())
    await expect(setNotice(party.id, owner.id, 'a'.repeat(501))).rejects.toBeInstanceOf(ValidationError)
  })
})

describe('cancelParty', () => {
  it('owner 가 cancel 가능', async () => {
    const owner = await makeUser(_db)
    const party = await createParty(owner.id, makeBaseInput())
    await cancelParty(party.id, owner.id)
    const detail = await getParty(party.id)
    expect(detail!.status).toBe('cancelled')
  })

  it('owner 가 아니면 NotOwnerError', async () => {
    const owner = await makeUser(_db)
    const stranger = await makeUser(_db)
    const party = await createParty(owner.id, makeBaseInput())
    await expect(cancelParty(party.id, stranger.id)).rejects.toBeInstanceOf(NotOwnerError)
  })

  it('이미 closed 면 PartyClosedError', async () => {
    const owner = await makeUser(_db)
    const party = await createParty(owner.id, makeBaseInput())
    await cancelParty(party.id, owner.id)
    await expect(cancelParty(party.id, owner.id)).rejects.toBeInstanceOf(PartyClosedError)
  })
})

describe('listMyHistory + listMyOpenParties', () => {
  it('open 파티는 listMyHistory 에 안 나옴, listMyOpenParties 에 나옴', async () => {
    const owner = await makeUser(_db)
    const party = await createParty(owner.id, makeBaseInput())
    const history = await listMyHistory(owner.id)
    const open = await listMyOpenParties(owner.id)
    expect(history.map((h) => h.id)).not.toContain(party.id)
    expect(open.map((p) => p.id)).toContain(party.id)
  })

  it('cancelled 파티는 listMyHistory 에 나옴', async () => {
    const owner = await makeUser(_db)
    const party = await createParty(owner.id, makeBaseInput())
    await cancelParty(party.id, owner.id)
    const history = await listMyHistory(owner.id)
    expect(history.map((h) => h.id)).toContain(party.id)
    const open = await listMyOpenParties(owner.id)
    expect(open.map((p) => p.id)).not.toContain(party.id)
  })

  it('타인의 파티에는 안 나옴', async () => {
    const owner = await makeUser(_db)
    const other = await makeUser(_db)
    const party = await createParty(owner.id, makeBaseInput())
    await cancelParty(party.id, owner.id)
    const history = await listMyHistory(other.id)
    expect(history.map((h) => h.id)).not.toContain(party.id)
  })
})

describe('getPartyForReclone', () => {
  it('기존 파티 prefill 반환 (departAt/joinUntil 은 0)', async () => {
    const owner = await makeUser(_db)
    const party = await createParty(owner.id, {
      ...makeBaseInput(),
      name: '원본',
      priceBand: '1만원대',
      capacity: 5,
      isSilent: true,
    })
    const prefill = await getPartyForReclone(party.id)
    expect(prefill.name).toBe('원본')
    expect(prefill.priceBand).toBe('1만원대')
    expect(prefill.capacity).toBe(5)
    expect(prefill.isSilent).toBe(true)
    expect(prefill.departAt).toBe(0)
    expect(prefill.joinUntil).toBe(0)
  })

  it('없는 id 면 PartyNotFoundError', async () => {
    await expect(getPartyForReclone(9999)).rejects.toBeInstanceOf(PartyNotFoundError)
  })
})

describe('getUserVisitHistory', () => {
  it('식당 ID가 있는 파티만 집계, 같은 식당 visitCount 누적', async () => {
    const owner = await makeUser(_db)
    const { restaurants } = await import('@/drizzle/schema')
    _db.insert(restaurants).values({ id: 1, name: '국밥집', createdAt: Date.now() }).run()
    _db.insert(restaurants).values({ id: 2, name: '돈까스집', createdAt: Date.now() }).run()

    await createParty(owner.id, {
      ...makeBaseInput(),
      restaurantId: 1,
      departAt: inMinutes(60),
      joinUntil: inMinutes(40),
    })
    await createParty(owner.id, {
      ...makeBaseInput(),
      restaurantId: 1,
      departAt: inMinutes(120),
      joinUntil: inMinutes(50),
    })
    await createParty(owner.id, {
      ...makeBaseInput(),
      restaurantId: 2,
      departAt: inMinutes(180),
      joinUntil: inMinutes(60),
    })
    // freetext party — restaurantId null → 집계 X
    await createParty(owner.id, makeBaseInput())

    const visits = await getUserVisitHistory(owner.id, 0)
    expect(visits.length).toBe(2)
    const r1 = visits.find((v) => v.restaurantId === 1)!
    expect(r1.visitCount).toBe(2)
    const r2 = visits.find((v) => v.restaurantId === 2)!
    expect(r2.visitCount).toBe(1)
  })

  it('joinParty 만 한 경우도 집계', async () => {
    const owner = await makeUser(_db)
    const guest = await makeUser(_db)
    const { restaurants } = await import('@/drizzle/schema')
    _db.insert(restaurants).values({ id: 1, name: '국밥집', createdAt: Date.now() }).run()
    const p = await createParty(owner.id, { ...makeBaseInput(), restaurantId: 1 })
    await joinParty(p.id, guest.id)
    const visits = await getUserVisitHistory(guest.id, 0)
    expect(visits.map((v) => v.restaurantId)).toEqual([1])
  })
})
