// leaveParty — Functional Design §3.5
// owner는 leave 불가 → cancelParty 사용. 이미 출발 시각 지난 closed 파티는 leave 불가.
import { eq, and } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { parties, partyMembers } from '@/drizzle/schema'
import {
  PartyNotFoundError,
  NotMemberError,
  OwnerCannotLeaveError,
  PartyClosedError,
} from './_lib/errors'

export async function leaveParty(partyId: number, userId: number): Promise<void> {
  const db = getDb()
  db.transaction((tx) => {
    const partyRows = tx.select().from(parties).where(eq(parties.id, partyId)).limit(1).all()
    const party = partyRows[0]
    if (!party) throw new PartyNotFoundError(partyId)
    if (party.status !== 'open') throw new PartyClosedError(partyId)
    if (party.ownerId === userId) throw new OwnerCannotLeaveError()

    const existing = tx
      .select({ userId: partyMembers.userId })
      .from(partyMembers)
      .where(and(eq(partyMembers.partyId, partyId), eq(partyMembers.userId, userId)))
      .limit(1)
      .all()
    if (!existing[0]) throw new NotMemberError()

    tx.delete(partyMembers).where(and(eq(partyMembers.partyId, partyId), eq(partyMembers.userId, userId))).run()
  })
}
