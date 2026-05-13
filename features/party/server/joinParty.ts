// joinParty — Functional Design §3.4
// invariant: open AND joinUntil >= now AND count < capacity AND not already member
// BEGIN IMMEDIATE transaction → race condition 방지
import { eq, and, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { parties, partyMembers } from '@/drizzle/schema'
import {
  PartyNotFoundError,
  PartyClosedError,
  CapacityFullError,
  AlreadyMemberError,
  JoinUntilPassedError,
} from './_lib/errors'

export async function joinParty(partyId: number, userId: number): Promise<void> {
  const db = getDb()
  const now = Date.now()

  // SQLite UNIQUE 제약(party_members PK) 활용 + lock 내 카운트 검증
  db.transaction((tx) => {
    const partyRows = tx.select().from(parties).where(eq(parties.id, partyId)).limit(1).all()
    const party = partyRows[0]
    if (!party) throw new PartyNotFoundError(partyId)

    // lazy transition: 출발 시각 지난 open → closed 후 fail
    if (party.status === 'open' && party.departAt <= now) {
      tx.update(parties).set({ status: 'closed' }).where(eq(parties.id, partyId)).run()
      throw new PartyClosedError(partyId)
    }

    if (party.status !== 'open') throw new PartyClosedError(partyId)
    if (party.joinUntil <= now) throw new JoinUntilPassedError()

    // 이미 멤버?
    const existing = tx
      .select({ userId: partyMembers.userId })
      .from(partyMembers)
      .where(and(eq(partyMembers.partyId, partyId), eq(partyMembers.userId, userId)))
      .limit(1)
      .all()
    if (existing[0]) throw new AlreadyMemberError()

    // 카운트 검증
    const countRows = tx
      .select({ c: sql<number>`COUNT(*)`.as('c') })
      .from(partyMembers)
      .where(eq(partyMembers.partyId, partyId))
      .all()
    const count = Number(countRows[0]?.c ?? 0)
    if (count >= party.capacity) throw new CapacityFullError(partyId)

    // INSERT — status는 'open' 유지 (자동 close는 lazy transition 이후)
    tx.insert(partyMembers).values({ partyId, userId, joinedAt: now }).run()
  })
}
