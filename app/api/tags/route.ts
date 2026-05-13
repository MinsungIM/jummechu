// M3 restaurant — 태그 자동완성·인기 태그
//   ?prefix=가성  → suggestTags
//   ?limit=20    → getPopularTags (prefix 없을 때)
import { ok, err } from '@/lib/http'
import { suggestTags, getPopularTags } from '@/features/restaurant'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const prefix = url.searchParams.get('prefix')
  const limitRaw = url.searchParams.get('limit')
  const limit = limitRaw ? Math.min(Math.max(Number(limitRaw) || 20, 1), 100) : 20

  try {
    const tags = prefix && prefix.trim().length > 0 ? await suggestTags(prefix) : await getPopularTags(limit)
    return ok({ tags })
  } catch (e) {
    if (e instanceof Error) return err('INTERNAL', e.message, 500)
    return err('INTERNAL', 'Unknown error', 500)
  }
}
