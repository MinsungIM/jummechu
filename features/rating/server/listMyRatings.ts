// listMyRatings — 내가 남긴 식당+메뉴 평가
// functional-design.md §2.5
import { eq, desc } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { restaurantRatings, menuRatings } from '@/drizzle/schema'
import type { RatingForRestaurant, RatingForMenu } from '../types'

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

export async function listMyRatings(
  userId: number
): Promise<{ restaurants: RatingForRestaurant[]; menus: RatingForMenu[] }> {
  const db = getDb()

  const rRows = await db
    .select()
    .from(restaurantRatings)
    .where(eq(restaurantRatings.raterUserId, userId))
    .orderBy(desc(restaurantRatings.createdAt))

  const mRows = await db
    .select()
    .from(menuRatings)
    .where(eq(menuRatings.raterUserId, userId))
    .orderBy(desc(menuRatings.createdAt))

  return {
    restaurants: rRows.map((r) => ({
      id: r.id,
      restaurantId: r.restaurantId,
      userId: r.raterUserId,
      partyId: r.partyId,
      stars: r.stars,
      tagLabels: parseTags(r.tagsJson),
      createdAt: r.createdAt,
    })),
    menus: mRows.map((m) => ({
      id: m.id,
      menuId: m.menuId,
      userId: m.raterUserId,
      partyId: m.partyId,
      stars: m.stars,
      comment: m.comment,
      createdAt: m.createdAt,
    })),
  }
}
