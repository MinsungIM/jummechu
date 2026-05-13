// suggestTags — Functional Design §4.8
// 자동완성 입력기 (M7). prefix LIKE prefix% + usageCount DESC, limit 20.
import { sql, desc, asc } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { tags } from '@/drizzle/schema'
import type { Tag } from '../types'
import { getPopularTags } from './getPopularTags'

const SUGGEST_LIMIT = 20

export async function suggestTags(prefix: string): Promise<Tag[]> {
  const trimmed = (prefix ?? '').trim().replace(/^#/, '').trim().toLowerCase()
  if (trimmed.length === 0) {
    return getPopularTags(SUGGEST_LIMIT)
  }
  // LIKE wildcard 이스케이프 — _ 와 % 는 자유 입력에서 거의 없지만 안전 처리
  const escaped = trimmed.replace(/[\\_%]/g, (m) => `\\${m}`)
  const pattern = escaped + '%'
  return getDb()
    .select({ id: tags.id, label: tags.label, usageCount: tags.usageCount })
    .from(tags)
    .where(sql`${tags.label} LIKE ${pattern} ESCAPE '\\'`)
    .orderBy(desc(tags.usageCount), asc(tags.label))
    .limit(SUGGEST_LIMIT)
}
