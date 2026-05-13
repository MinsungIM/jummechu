// listMy — Functional Design §3.2
// read + unread 통합. limit default 30.
import { desc, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { notifications } from '@/drizzle/schema'
import type { Notification } from '../types'
import { rowToNotification } from './_lib/mappers'

const DEFAULT_LIMIT = 30
const MAX_LIMIT = 100

export async function listMy(userId: number, limit: number = DEFAULT_LIMIT): Promise<Notification[]> {
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), MAX_LIMIT)
  const db = getDb()
  const rows = db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(safeLimit)
    .all()
  return rows.map(rowToNotification)
}
