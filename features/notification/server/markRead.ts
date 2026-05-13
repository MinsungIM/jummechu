// markRead — Functional Design §3.4
// ⭐ I-3 핵심: WHERE id=? AND user_id=? — 다른 사용자 알림은 영향 없음
// affected==0 일 때 throw 안 함 (idempotent). 호출자는 별도 확인 불필요.
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { notifications } from '@/drizzle/schema'

export async function markRead(userId: number, notificationId: number): Promise<void> {
  if (!Number.isInteger(notificationId) || notificationId <= 0) return
  if (!Number.isInteger(userId) || userId <= 0) return
  const db = getDb()
  db.update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .run()
}
