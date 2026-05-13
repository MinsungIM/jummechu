// getMenu — Functional Design §4.6 (M4 사용)
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { menus } from '@/drizzle/schema'
import type { Menu } from '../types'

export async function getMenu(menuId: number): Promise<Menu | null> {
  const rows = await getDb()
    .select({
      id: menus.id,
      restaurantId: menus.restaurantId,
      name: menus.name,
      price: menus.price,
    })
    .from(menus)
    .where(eq(menus.id, menuId))
    .limit(1)
  return rows[0] ?? null
}
