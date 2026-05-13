// notifyDepartSoon — Functional Design §3.5
// ⭐ I-2 idempotency: 같은 (user, party, kind='depart_soon') 조합은 1 row 보장.
// cron 또는 lazy fan-out 호출 안전.
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { parties, partyMembers, notifications } from '@/drizzle/schema'

export async function notifyDepartSoon(partyId: number): Promise<void> {
  if (!Number.isInteger(partyId) || partyId <= 0) return
  const db = getDb()
  const now = Date.now()

  db.transaction((tx) => {
    // 1. 파티 조회
    const partyRows = tx
      .select({
        id: parties.id,
        name: parties.name,
        place: parties.place,
        restaurantNameFreetext: parties.restaurantNameFreetext,
      })
      .from(parties)
      .where(eq(parties.id, partyId))
      .limit(1)
      .all()
    const party = partyRows[0]
    if (!party) return // 존재하지 않는 파티 — silent

    // 2. 멤버 user_id 목록
    const memberRows = tx
      .select({ userId: partyMembers.userId })
      .from(partyMembers)
      .where(eq(partyMembers.partyId, partyId))
      .all()

    if (memberRows.length === 0) return

    // 3. 이미 보낸 사용자 목록 (I-2 idempotency)
    const existingRows = tx
      .select({ userId: notifications.userId })
      .from(notifications)
      .where(
        and(
          eq(notifications.partyId, partyId),
          eq(notifications.kind, 'depart_soon')
        )
      )
      .all()
    const alreadySent = new Set(existingRows.map((r) => r.userId))

    // 4. 미전송 사용자에게만 INSERT
    const title = `5분 후 출발: ${party.name}`
    const body = party.place ?? party.restaurantNameFreetext ?? null
    const url = `/parties/${partyId}`

    const toInsert = memberRows
      .filter((m) => !alreadySent.has(m.userId))
      .map((m) => ({
        userId: m.userId,
        partyId,
        kind: 'depart_soon' as const,
        title,
        body,
        url,
        isRead: false,
        createdAt: now,
      }))

    if (toInsert.length > 0) {
      tx.insert(notifications).values(toInsert).run()
    }
  })
}
