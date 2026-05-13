// listMyUnread — Functional Design §3.1
// SELECT WHERE user_id=? AND is_read=0 ORDER BY created_at DESC
// 배지 카운트 + InAppBanner kind 필터까지 같이 처리하므로 cap 두지 않음.
// 인덱스 `(user_id, is_read, created_at)` hit 으로 대용량도 안전.
import { and, desc, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { notifications } from '@/drizzle/schema'
import type { Notification } from '../types'
import { rowToNotification } from './_lib/mappers'

export async function listMyUnread(userId: number): Promise<Notification[]> {
  const db = getDb()
  const rows = db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .orderBy(desc(notifications.createdAt))
    .all()
  return rows.map(rowToNotification)
}
