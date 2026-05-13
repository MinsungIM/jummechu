// notifyCancelled — Functional Design §3.7
// 현재 멤버 전원에 파티 취소 알림. 호출 시점의 멤버 집합 기준.
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { parties, partyMembers, notifications } from '@/drizzle/schema'

export async function notifyCancelled(partyId: number): Promise<void> {
  if (!Number.isInteger(partyId) || partyId <= 0) return

  const db = getDb()
  const now = Date.now()

  db.transaction((tx) => {
    const partyRows = tx
      .select({ id: parties.id, name: parties.name })
      .from(parties)
      .where(eq(parties.id, partyId))
      .limit(1)
      .all()
    const party = partyRows[0]
    if (!party) return

    const memberRows = tx
      .select({ userId: partyMembers.userId })
      .from(partyMembers)
      .where(eq(partyMembers.partyId, partyId))
      .all()

    if (memberRows.length === 0) return

    const title = `파티 취소됨: ${party.name}`
    // 취소된 파티 상세는 더 이상 의미 없으므로 히스토리로 유도
    const url = `/history`

    const toInsert = memberRows.map((m) => ({
      userId: m.userId,
      partyId,
      kind: 'cancelled' as const,
      title,
      body: null,
      url,
      isRead: false,
      createdAt: now,
    }))

    tx.insert(notifications).values(toInsert).run()
  })
}
