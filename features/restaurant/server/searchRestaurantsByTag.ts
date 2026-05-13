// searchRestaurantsByTag — Functional Design §4.4
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { tags } from '@/drizzle/schema'
import { normalizeTagLabel } from './_lib/normalizeTag'
import { listRestaurantsByTags } from './listRestaurantsByTags'
import type { Restaurant } from '../types'

export async function searchRestaurantsByTag(label: string): Promise<Restaurant[]> {
  // 정규화 단계 — 빈 입력은 ValidationError throw (호출자가 미리 검증 권장)
  const normalized = normalizeTagLabel(label)

  const rows = await getDb()
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.label, normalized))
    .limit(1)
  const tagRow = rows[0]
  if (!tagRow) return []

  return listRestaurantsByTags([tagRow.id])
}
