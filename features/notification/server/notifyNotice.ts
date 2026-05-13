// notifyNotice — Functional Design §3.6
// 현재 멤버 전원에 한 줄 공지 변경 알림. idempotent 하지 않음 (공지 변경마다 새 알림).
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { parties, partyMembers, notifications } from '@/drizzle/schema'

const BODY_PREVIEW_LEN = 100

export async function notifyNotice(partyId: number, text: string): Promise<void> {
  if (!Number.isInteger(partyId) || partyId <= 0) return
  const trimmed = (text ?? '').trim()
  const body = trimmed.length > BODY_PREVIEW_LEN ? trimmed.slice(0, BODY_PREVIEW_LEN) + '…' : trimmed || null

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

    const title = `새 공지: ${party.name}`
    const url = `/parties/${partyId}`

    const toInsert = memberRows.map((m) => ({
      userId: m.userId,
      partyId,
      kind: 'notice' as const,
      title,
      body,
      url,
      isRead: false,
      createdAt: now,
    }))

    tx.insert(notifications).values(toInsert).run()
  })
}
