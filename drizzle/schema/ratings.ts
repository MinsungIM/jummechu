// M4 rating 소유 테이블 (restaurant_ratings, menu_ratings)
import { sqliteTable, integer, text, unique, index } from 'drizzle-orm/sqlite-core'
import { users } from './users'
import { restaurants, menus } from './restaurants'
import { parties } from './parties'

// 식당 평가 — 별점(선택) + 태그(JSON 배열) — design.md §3
export const restaurantRatings = sqliteTable(
  'restaurant_ratings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    restaurantId: integer('restaurant_id')
      .notNull()
      .references(() => restaurants.id),
    raterUserId: integer('rater_user_id')
      .notNull()
      .references(() => users.id),
    partyId: integer('party_id')
      .notNull()
      .references(() => parties.id),
    stars: integer('stars'),
    tagsJson: text('tags_json'), // JSON 배열 직렬화 (`["#가성비", "#대기길다"]`)
    createdAt: integer('created_at').notNull(),
  },
  (t) => ({
    uniqRaterParty: unique().on(t.restaurantId, t.raterUserId, t.partyId),
    restaurantIdx: index('restaurant_ratings_restaurant_idx').on(t.restaurantId),
  })
)

// 메뉴 평가 — 별점(필수) + 한 줄 코멘트
export const menuRatings = sqliteTable(
  'menu_ratings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    menuId: integer('menu_id')
      .notNull()
      .references(() => menus.id),
    raterUserId: integer('rater_user_id')
      .notNull()
      .references(() => users.id),
    partyId: integer('party_id')
      .notNull()
      .references(() => parties.id),
    stars: integer('stars').notNull(),
    comment: text('comment'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => ({
    uniqRaterParty: unique().on(t.menuId, t.raterUserId, t.partyId),
    menuIdx: index('menu_ratings_menu_idx').on(t.menuId),
  })
)

export type RestaurantRatingRow = typeof restaurantRatings.$inferSelect
export type MenuRatingRow = typeof menuRatings.$inferSelect
