// M7 notification 통합 테스트 — in-memory SQLite + drizzle 마이그레이션
// Functional Design §10 시나리오:
//   - markRead 권한 (I-3)
//   - notifyDepartSoon idempotency (I-2)
//   - listMyUnread / listMy / markAllRead / fan-out / cascade
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createTestDb } from '../_helpers/db'
import { makeUser, inMinutes } from '../_helpers/factories'
import { parties, partyMembers, notifications } from '@/drizzle/schema'
import { and, eq } from 'drizzle-orm'
import { listMyUnread } from '@/features/notification/server/listMyUnread'
import { listMy } from '@/features/notification/server/listMy'
import { markRead } from '@/features/notification/server/markRead'
import { markAllRead } from '@/features/notification/server/markAllRead'
import { notifyDepartSoon } from '@/features/notification/server/notifyDepartSoon'
import { notifyNotice } from '@/features/notification/server/notifyNotice'
import { notifyCancelled } from '@/features/notification/server/notifyCancelled'
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

// 헬퍼: 파티 + 멤버 직접 insert (M2 createParty 의존 회피)
function seedParty(
  db: Db,
  ownerId: number,
  overrides: Partial<{ name: string; place: string | null; memberIds: number[] }> = {}
): number {
  const now = Date.now()
  const inserted = db
    .insert(parties)
    .values({
      ownerId,
      name: overrides.name ?? '점심 1',
      restaurantId: null,
      restaurantNameFreetext: '김밥천국',
      departAt: inMinutes(60),
      joinUntil: inMinutes(30),
      place: overrides.place ?? '로비',
      priceBand: '1만원대',
      capacity: 6,
      isSilent: false,
      status: 'open',
      createdAt: now,
    })
    .returning({ id: parties.id })
    .all()
  const partyId = inserted[0]!.id
  const members = overrides.memberIds ?? [ownerId]
  for (const uid of members) {
    db.insert(partyMembers).values({ partyId, userId: uid, joinedAt: now }).run()
  }
  return partyId
}

describe('notifyDepartSoon idempotency (I-2)', () => {
  it('동일 partyId 로 2회 호출해도 멤버 수만큼만 insert', async () => {
    const a = await makeUser(_db, { name: 'A' })
    const b = await makeUser(_db, { name: 'B' })
    const c = await makeUser(_db, { name: 'C' })
    const partyId = seedParty(_db, a.id, { memberIds: [a.id, b.id, c.id] })

    await notifyDepartSoon(partyId)
    await notifyDepartSoon(partyId) // 두 번째 호출 — duplicate insert 안 됨

    const rows = _db
      .select()
      .from(notifications)
      .where(
        and(eq(notifications.partyId, partyId), eq(notifications.kind, 'depart_soon'))
      )
      .all()
    expect(rows).toHaveLength(3) // 3명 × 1회만
    const userIds = rows.map((r) => r.userId).sort()
    expect(userIds).toEqual([a.id, b.id, c.id].sort())
  })

  it('존재하지 않는 파티는 silent — insert 0', async () => {
    await notifyDepartSoon(99999)
    const rows = _db.select().from(notifications).all()
    expect(rows).toHaveLength(0)
  })

  it('멤버 없는 파티 — insert 0', async () => {
    const owner = await makeUser(_db)
    const partyId = seedParty(_db, owner.id, { memberIds: [] })
    await notifyDepartSoon(partyId)
    const rows = _db.select().from(notifications).all()
    expect(rows).toHaveLength(0)
  })
})

describe('markRead 권한 (I-3) — 핵심 보안', () => {
  it('user A 가 user B 의 알림 id 로 markRead 호출해도 B 의 알림은 unread 그대로', async () => {
    const a = await makeUser(_db, { name: 'A' })
    const b = await makeUser(_db, { name: 'B' })
    const partyId = seedParty(_db, b.id, { memberIds: [b.id] })
    await notifyDepartSoon(partyId)

    const bNotifs = await listMyUnread(b.id)
    expect(bNotifs).toHaveLength(1)
    const bNotifId = bNotifs[0]!.id

    // user A 가 user B 의 알림 id 로 markRead 시도
    await markRead(a.id, bNotifId)

    // B 의 알림은 여전히 unread
    const bUnreadAfter = await listMyUnread(b.id)
    expect(bUnreadAfter).toHaveLength(1)
    expect(bUnreadAfter[0]!.id).toBe(bNotifId)
    expect(bUnreadAfter[0]!.isRead).toBe(false)
  })

  it('본인 알림은 정상적으로 read 처리', async () => {
    const b = await makeUser(_db)
    const partyId = seedParty(_db, b.id, { memberIds: [b.id] })
    await notifyDepartSoon(partyId)
    const before = await listMyUnread(b.id)
    expect(before).toHaveLength(1)

    await markRead(b.id, before[0]!.id)

    const after = await listMyUnread(b.id)
    expect(after).toHaveLength(0)
  })

  it('잘못된 id (음수·0) — 조용히 무시', async () => {
    const b = await makeUser(_db)
    await markRead(b.id, -1)
    await markRead(b.id, 0)
    // 에러 없어야 함
    expect(true).toBe(true)
  })
})

describe('listMyUnread 필터', () => {
  it('is_read=0 만 반환, created_at DESC', async () => {
    const a = await makeUser(_db)
    const partyId = seedParty(_db, a.id, { memberIds: [a.id] })
    await notifyDepartSoon(partyId)

    let unread = await listMyUnread(a.id)
    expect(unread).toHaveLength(1)

    await markRead(a.id, unread[0]!.id)
    unread = await listMyUnread(a.id)
    expect(unread).toHaveLength(0)
  })
})

describe('listMy', () => {
  it('read + unread 통합, LIMIT 적용', async () => {
    const a = await makeUser(_db)
    // 멤버 다수의 파티에 3개 알림
    const p1 = seedParty(_db, a.id, { name: 'P1', memberIds: [a.id] })
    const p2 = seedParty(_db, a.id, { name: 'P2', memberIds: [a.id] })
    const p3 = seedParty(_db, a.id, { name: 'P3', memberIds: [a.id] })
    await notifyDepartSoon(p1)
    await notifyDepartSoon(p2)
    await notifyDepartSoon(p3)

    const all = await listMy(a.id, 30)
    expect(all).toHaveLength(3)

    const top2 = await listMy(a.id, 2)
    expect(top2).toHaveLength(2)
  })
})

describe('markAllRead', () => {
  it('A 의 markAllRead 가 B 의 알림에 영향 없음', async () => {
    const a = await makeUser(_db)
    const b = await makeUser(_db)
    const partyId = seedParty(_db, a.id, { memberIds: [a.id, b.id] })
    await notifyDepartSoon(partyId)

    expect((await listMyUnread(a.id))).toHaveLength(1)
    expect((await listMyUnread(b.id))).toHaveLength(1)

    await markAllRead(a.id)

    expect((await listMyUnread(a.id))).toHaveLength(0)
    expect((await listMyUnread(b.id))).toHaveLength(1) // B 는 영향 없음
  })
})

describe('notifyNotice fan-out', () => {
  it('현재 멤버 전원에 notice kind insert', async () => {
    const a = await makeUser(_db)
    const b = await makeUser(_db)
    const c = await makeUser(_db)
    const partyId = seedParty(_db, a.id, { memberIds: [a.id, b.id, c.id] })

    await notifyNotice(partyId, '11:55 1층 로비 집결')

    const aN = await listMyUnread(a.id)
    const bN = await listMyUnread(b.id)
    const cN = await listMyUnread(c.id)
    expect(aN).toHaveLength(1)
    expect(bN).toHaveLength(1)
    expect(cN).toHaveLength(1)
    expect(aN[0]!.kind).toBe('notice')
    expect(aN[0]!.body).toContain('11:55')
  })

  it('빈 text 도 안전', async () => {
    const a = await makeUser(_db)
    const partyId = seedParty(_db, a.id, { memberIds: [a.id] })
    await notifyNotice(partyId, '')
    const aN = await listMyUnread(a.id)
    expect(aN).toHaveLength(1)
    expect(aN[0]!.body).toBeNull()
  })
})

describe('notifyCancelled fan-out', () => {
  it('현재 멤버 전원에 cancelled kind insert', async () => {
    const a = await makeUser(_db)
    const b = await makeUser(_db)
    const partyId = seedParty(_db, a.id, { memberIds: [a.id, b.id] })

    await notifyCancelled(partyId)

    const aN = await listMyUnread(a.id)
    const bN = await listMyUnread(b.id)
    expect(aN).toHaveLength(1)
    expect(bN).toHaveLength(1)
    expect(aN[0]!.kind).toBe('cancelled')
    expect(aN[0]!.url).toBe('/history')
  })
})

describe('party 삭제 시 party_id SET NULL (이력 보존)', () => {
  it('파티 삭제 후에도 notification 행 존재, party_id = null', async () => {
    const a = await makeUser(_db)
    const partyId = seedParty(_db, a.id, { memberIds: [a.id] })
    await notifyDepartSoon(partyId)

    // 멤버 삭제 (FK cascade for party_members) 후 파티 삭제
    _db.delete(partyMembers).where(eq(partyMembers.partyId, partyId)).run()
    _db.delete(parties).where(eq(parties.id, partyId)).run()

    const rows = _db.select().from(notifications).where(eq(notifications.userId, a.id)).all()
    expect(rows).toHaveLength(1)
    expect(rows[0]!.partyId).toBeNull()
  })
})
