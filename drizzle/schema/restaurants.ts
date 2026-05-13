// M3 restaurant 소유 테이블 (restaurants, menus, tags, restaurant_tags)
import { sqliteTable, integer, text, real, primaryKey, index } from 'drizzle-orm/sqlite-core'
import { users } from './users'

export const restaurants = sqliteTable('restaurants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  address: text('address'),
  category1: text('category1', { enum: ['kor', 'chn', 'jpn', 'wes'] }),
  category2: text('category2'),
  waitLevel: text('wait_level', { enum: ['light', 'medium', 'heavy'] }),
  reservationRequired: integer('reservation_required', { mode: 'boolean' })
    .notNull()
    .default(false),
  naverPlaceId: text('naver_place_id'),
  lat: real('lat'),
  lng: real('lng'),
  createdAt: integer('created_at').notNull(),
})

export const menus = sqliteTable(
  'menus',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    restaurantId: integer('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    price: integer('price'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => ({
    restaurantIdx: index('menus_restaurant_idx').on(t.restaurantId),
  })
)

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull().unique(),
  usageCount: integer('usage_count').notNull().default(0),
})

export const restaurantTags = sqliteTable(
  'restaurant_tags',
  {
    restaurantId: integer('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id),
    taggedBy: integer('tagged_by').references(() => users.id),
    createdAt: integer('created_at').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.restaurantId, t.tagId] }),
    tagIdx: index('restaurant_tags_tag_idx').on(t.tagId),
  })
)

export type RestaurantRow = typeof restaurants.$inferSelect
export type MenuRow = typeof menus.$inferSelect
export type TagRow = typeof tags.$inferSelect
export type RestaurantTagRow = typeof restaurantTags.$inferSelect
