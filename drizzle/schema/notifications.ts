// M7 notification 소유 테이블
import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core'
import { users } from './users'
import { parties } from './parties'

export const notifications = sqliteTable(
  'notifications',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    // partyId 는 nullable — kind='system' 또는 파티 삭제 후 set null (이력 보존)
    partyId: integer('party_id').references(() => parties.id, { onDelete: 'set null' }),
    kind: text('kind', { enum: ['depart_soon', 'notice', 'cancelled', 'system'] }).notNull(),
    title: text('title').notNull(),
    body: text('body'),
    url: text('url'),
    isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at').notNull(),
  },
  (t) => ({
    // listMyUnread + 배지 COUNT + listMy 모두 hit
    userUnreadCreatedIdx: index('notifications_user_unread_created_idx').on(
      t.userId,
      t.isRead,
      t.createdAt
    ),
  })
)

export type NotificationRow = typeof notifications.$inferSelect
export type NewNotificationRow = typeof notifications.$inferInsert
