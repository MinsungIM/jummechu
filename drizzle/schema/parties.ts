// M2 party 소유 테이블
import { sqliteTable, integer, text, primaryKey, index } from 'drizzle-orm/sqlite-core'
import { users } from './users'
import { restaurants } from './restaurants'

export const parties = sqliteTable(
  'parties',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ownerId: integer('owner_id')
      .notNull()
      .references(() => users.id),
    name: text('name').notNull(),
    restaurantId: integer('restaurant_id').references(() => restaurants.id),
    restaurantNameFreetext: text('restaurant_name_freetext'),
    departAt: integer('depart_at').notNull(),
    joinUntil: integer('join_until').notNull(),
    place: text('place'),
    priceBand: text('price_band'),
    capacity: integer('capacity').notNull(),
    rules: text('rules'),
    isSilent: integer('is_silent', { mode: 'boolean' }).notNull().default(false),
    extraSchedule: text('extra_schedule'),
    notice: text('notice'),
    status: text('status', { enum: ['open', 'closed', 'cancelled'] })
      .notNull()
      .default('open'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => ({
    departIdx: index('parties_depart_status_idx').on(t.departAt, t.status),
  })
)

export const partyMembers = sqliteTable(
  'party_members',
  {
    partyId: integer('party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    joinedAt: integer('joined_at').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.partyId, t.userId] }),
    userIdx: index('party_members_user_idx').on(t.userId),
  })
)

export type PartyRow = typeof parties.$inferSelect
export type NewPartyRow = typeof parties.$inferInsert
export type PartyMemberRow = typeof partyMembers.$inferSelect
export type NewPartyMemberRow = typeof partyMembers.$inferInsert
