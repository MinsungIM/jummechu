// getPopularTags — Functional Design §4.10
import { desc, asc } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { tags } from '@/drizzle/schema'
import type { Tag } from '../types'

export async function getPopularTags(limit: number): Promise<Tag[]> {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 20
  return getDb()
    .select({ id: tags.id, label: tags.label, usageCount: tags.usageCount })
    .from(tags)
    .orderBy(desc(tags.usageCount), asc(tags.label))
    .limit(safeLimit)
}
