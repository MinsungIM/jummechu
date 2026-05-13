// markAllRead — Functional Design §3.3
// 권한 (I-3): WHERE user_id=? — 본인 알림만 갱신
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { notifications } from '@/drizzle/schema'

export async function markAllRead(userId: number): Promise<void> {
  const db = getDb()
  db.update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .run()
}
