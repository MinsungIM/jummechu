// canRateMenu — 메뉴 평가 권한 검사 (소속 식당 방문자만)
// functional-design.md §2.6
// M3 미구현 단계에서도 동작하도록 menus 테이블 직접 SELECT
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { menus } from '@/drizzle/schema'
import { canRateRestaurant } from './canRateRestaurant'

export async function canRateMenu(userId: number, menuId: number): Promise<boolean> {
  const db = getDb()
  const rows = await db.select({ restaurantId: menus.restaurantId }).from(menus).where(eq(menus.id, menuId)).limit(1)
  const menu = rows[0]
  if (!menu) return false
  return canRateRestaurant(userId, menu.restaurantId)
}
