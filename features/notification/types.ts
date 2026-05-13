// M7 notification Public 타입 — Functional Design §1·§7
export type NotificationKind = 'depart_soon' | 'notice' | 'cancelled' | 'system'

export type Notification = {
  id: number
  userId: number
  partyId: number | null
  kind: NotificationKind
  title: string
  body: string | null
  url: string | null
  isRead: boolean
  createdAt: number
}
