// setNotice — Functional Design §3.6. owner만 가능.
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { parties } from '@/drizzle/schema'
import { PartyNotFoundError, NotOwnerError, ValidationError } from './_lib/errors'

export async function setNotice(partyId: number, ownerId: number, text: string): Promise<void> {
  const trimmed = text.trim()
  if (trimmed.length > 500) {
    throw new ValidationError({ notice: '공지는 500자 이하' })
  }

  const db = getDb()
  db.transaction((tx) => {
    const rows = tx.select().from(parties).where(eq(parties.id, partyId)).limit(1).all()
    const party = rows[0]
    if (!party) throw new PartyNotFoundError(partyId)
    if (party.ownerId !== ownerId) throw new NotOwnerError()

    tx.update(parties).set({ notice: trimmed || null }).where(eq(parties.id, partyId)).run()
  })
}
