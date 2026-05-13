// rateRestaurant — upsert: (userId, restaurantId) 단일 행 정책
// functional-design.md §2.1
import { eq, and } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { restaurantRatings } from '@/drizzle/schema'
import type { RatingForRestaurant, RateRestaurantInput } from '../types'
import { validateStars, validateTagLabels } from './_lib/validation'
import { NotEligibleError } from './_lib/errors'
import { canRateRestaurant } from './canRateRestaurant'

function parseTags(json: string | null): string[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string')
  } catch {
    return []
  }
}

export async function rateRestaurant(
  userId: number,
  restaurantId: number,
  partyId: number,
  stars?: number,
  _comment?: string, // 스키마에 컬럼 없음 (functional-design §2.1) — silent drop
  tagLabels?: string[]
): Promise<RatingForRestaurant> {
  // 1. 입력 검증
  validateStars(stars, false)
  validateTagLabels(tagLabels)

  // 2. 권한
  const allowed = await canRateRestaurant(userId, restaurantId)
  if (!allowed) {
    throw new NotEligibleError(`사용자 ${userId}는 식당 ${restaurantId} 평가 권한 없음 (다녀온 파티 없음)`)
  }

  // 3. upsert (transaction)
  const db = getDb()
  const tagsJson = tagLabels && tagLabels.length > 0 ? JSON.stringify(tagLabels) : null
  const now = Date.now()

  const result = db.transaction((tx) => {
    const existing = tx
      .select()
      .from(restaurantRatings)
      .where(and(eq(restaurantRatings.restaurantId, restaurantId), eq(restaurantRatings.raterUserId, userId)))
      .limit(1)
      .all()

    const found = existing[0]
    if (found) {
      tx.update(restaurantRatings)
        .set({
          stars: stars ?? null,
          tagsJson,
          partyId,
          createdAt: now,
        })
        .where(eq(restaurantRatings.id, found.id))
        .run()
      const row = tx.select().from(restaurantRatings).where(eq(restaurantRatings.id, found.id)).limit(1).all()[0]!
      return row
    }

    const inserted = tx
      .insert(restaurantRatings)
      .values({
        restaurantId,
        raterUserId: userId,
        partyId,
        stars: stars ?? null,
        tagsJson,
        createdAt: now,
      })
      .returning()
      .all()
    return inserted[0]!
  })

  return {
    id: result.id,
    restaurantId: result.restaurantId,
    userId: result.raterUserId,
    partyId: result.partyId,
    stars: result.stars,
    tagLabels: parseTags(result.tagsJson),
    createdAt: result.createdAt,
  }
}
