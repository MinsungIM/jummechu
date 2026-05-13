// rateMenu — upsert: (userId, menuId) 단일 행 정책
// functional-design.md §2.2
import { eq, and } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { menuRatings } from '@/drizzle/schema'
import type { RatingForMenu } from '../types'
import { validateStars, validateComment } from './_lib/validation'
import { NotEligibleError } from './_lib/errors'
import { canRateMenu } from './canRateMenu'

export async function rateMenu(
  userId: number,
  menuId: number,
  partyId: number,
  stars: number,
  comment?: string
): Promise<RatingForMenu> {
  validateStars(stars, true)
  validateComment(comment)

  const allowed = await canRateMenu(userId, menuId)
  if (!allowed) {
    throw new NotEligibleError(`사용자 ${userId}는 메뉴 ${menuId} 평가 권한 없음 (소속 식당 방문 기록 없음)`)
  }

  const db = getDb()
  const now = Date.now()
  const trimmedComment = comment && comment.length > 0 ? comment : null

  const result = db.transaction((tx) => {
    const existing = tx
      .select()
      .from(menuRatings)
      .where(and(eq(menuRatings.menuId, menuId), eq(menuRatings.raterUserId, userId)))
      .limit(1)
      .all()

    const found = existing[0]
    if (found) {
      tx.update(menuRatings)
        .set({ stars, comment: trimmedComment, partyId, createdAt: now })
        .where(eq(menuRatings.id, found.id))
        .run()
      return tx.select().from(menuRatings).where(eq(menuRatings.id, found.id)).limit(1).all()[0]!
    }

    const inserted = tx
      .insert(menuRatings)
      .values({
        menuId,
        raterUserId: userId,
        partyId,
        stars,
        comment: trimmedComment,
        createdAt: now,
      })
      .returning()
      .all()
    return inserted[0]!
  })

  return {
    id: result.id,
    menuId: result.menuId,
    userId: result.raterUserId,
    partyId: result.partyId,
    stars: result.stars,
    comment: result.comment,
    createdAt: result.createdAt,
  }
}
