// cancelParty — Functional Design §3.7. owner만 가능. status='cancelled'.
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { parties } from '@/drizzle/schema'
import { PartyNotFoundError, NotOwnerError, PartyClosedError } from './_lib/errors'

export async function cancelParty(partyId: number, ownerId: number): Promise<void> {
  const db = getDb()
  db.transaction((tx) => {
    const rows = tx.select().from(parties).where(eq(parties.id, partyId)).limit(1).all()
    const party = rows[0]
    if (!party) throw new PartyNotFoundError(partyId)
    if (party.ownerId !== ownerId) throw new NotOwnerError()
    if (party.status !== 'open') throw new PartyClosedError(partyId)

    tx.update(parties).set({ status: 'cancelled' }).where(eq(parties.id, partyId)).run()
  })
}
