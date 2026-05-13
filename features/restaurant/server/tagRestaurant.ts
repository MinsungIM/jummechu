// tagRestaurant — Functional Design §4.9
// 트랜잭션 (BEGIN IMMEDIATE):
//   1) INSERT INTO tags ON CONFLICT DO NOTHING
//   2) SELECT tag id (정규화된 label)
//   3) INSERT INTO restaurant_tags ON CONFLICT DO NOTHING (이미 태깅돼 있으면 멱등)
//   4) UPDATE tags.usage_count = COUNT(restaurant_tags WHERE tag_id=?)
import { eq, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { restaurants, tags, restaurantTags } from '@/drizzle/schema'
import { normalizeTagLabel } from './_lib/normalizeTag'
import { RestaurantNotFoundError } from './_lib/errors'

export async function tagRestaurant(
  restaurantId: number,
  label: string,
  byUserId: number
): Promise<void> {
  const normalized = normalizeTagLabel(label) // ValidationError on invalid
  const db = getDb()

  // 식당 존재 검사 — 트랜잭션 밖에서 한 번 (FK 가 잡아주지만 명시적 404 코드)
  const exists = await db
    .select({ id: restaurants.id })
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId))
    .limit(1)
  if (!exists[0]) throw new RestaurantNotFoundError(restaurantId)

  const now = Date.now()
  db.transaction((tx) => {
    // 1) tag insert (ON CONFLICT — UNIQUE label)
    tx.insert(tags)
      .values({ label: normalized, usageCount: 0 })
      .onConflictDoNothing({ target: tags.label })
      .run()

    // 2) 해당 label 의 tag id
    const tagRows = tx
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.label, normalized))
      .limit(1)
      .all()
    const tagRow = tagRows[0]
    if (!tagRow) throw new Error('tag row missing after insert')

    // 3) restaurant_tags insert (PK 중복 시 멱등 — DO NOTHING)
    tx.insert(restaurantTags)
      .values({
        restaurantId,
        tagId: tagRow.id,
        taggedBy: byUserId,
        createdAt: now,
      })
      .onConflictDoNothing()
      .run()

    // 4) usage_count 재계산 — I-4 invariant
    tx
      .update(tags)
      .set({
        usageCount: sql`(SELECT COUNT(*) FROM ${restaurantTags} WHERE ${restaurantTags.tagId} = ${tagRow.id})`,
      })
      .where(eq(tags.id, tagRow.id))
      .run()
  })
}
