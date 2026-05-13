// getMembership — 특정 user가 파티 멤버인지 조회
import { eq, and } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { partyMembers } from '@/drizzle/schema'
import type { Membership } from '../types'

export async function getMembership(partyId: number, userId: number): Promise<Membership | null> {
  const db = getDb()
  const rows = await db
    .select()
    .from(partyMembers)
    .where(and(eq(partyMembers.partyId, partyId), eq(partyMembers.userId, userId)))
    .limit(1)
  const m = rows[0]
  if (!m) return null
  return { partyId: m.partyId, userId: m.userId, joinedAt: m.joinedAt }
}
