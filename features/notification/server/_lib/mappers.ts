// DB 행 → Public 타입 매퍼
import type { NotificationRow } from '@/drizzle/schema'
import type { Notification, NotificationKind } from '../../types'

export function rowToNotification(r: NotificationRow): Notification {
  return {
    id: r.id,
    userId: r.userId,
    partyId: r.partyId,
    kind: r.kind as NotificationKind,
    title: r.title,
    body: r.body,
    url: r.url,
    isRead: Boolean(r.isRead),
    createdAt: r.createdAt,
  }
}
