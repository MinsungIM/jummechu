// addMenu — Functional Design §4.5
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { menus, restaurants } from '@/drizzle/schema'
import { RestaurantNotFoundError, ValidationError } from './_lib/errors'
import type { Menu } from '../types'

const menuInputSchema = z.object({
  name: z.string().trim().min(1, '메뉴 이름을 입력해주세요').max(100, '100자 이내'),
  price: z.number().int().min(0, '0원 이상').max(1_000_000, '100만원 이하').nullable(),
})

export async function addMenu(
  restaurantId: number,
  name: string,
  price: number | null
): Promise<Menu> {
  const parsed = menuInputSchema.safeParse({ name, price })
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join('.') || '_'] = issue.message
    }
    throw new ValidationError(fieldErrors)
  }

  const db = getDb()
  const exists = await db.select({ id: restaurants.id }).from(restaurants).where(eq(restaurants.id, restaurantId)).limit(1)
  if (!exists[0]) throw new RestaurantNotFoundError(restaurantId)

  const inserted = db
    .insert(menus)
    .values({
      restaurantId,
      name: parsed.data.name,
      price: parsed.data.price,
      createdAt: Date.now(),
    })
    .returning({ id: menus.id, restaurantId: menus.restaurantId, name: menus.name, price: menus.price })
    .all()

  const row = inserted[0]
  if (!row) throw new Error('Failed to insert menu')
  return row
}
