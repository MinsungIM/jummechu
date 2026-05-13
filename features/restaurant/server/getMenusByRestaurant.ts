// getMenusByRestaurant — Functional Design §4.7
import { eq, desc } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { menus } from '@/drizzle/schema'
import type { Menu } from '../types'

export async function getMenusByRestaurant(restaurantId: number): Promise<Menu[]> {
  return getDb()
    .select({
      id: menus.id,
      restaurantId: menus.restaurantId,
      name: menus.name,
      price: menus.price,
    })
    .from(menus)
    .where(eq(menus.restaurantId, restaurantId))
    .orderBy(desc(menus.createdAt))
}
