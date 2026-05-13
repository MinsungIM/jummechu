// S8 해시태그 검색 결과 — UI.md §3.10
// URL: /restaurants/search?tag=가성비
import {
  searchRestaurantsByTag,
  getPopularTags,
  RestaurantList,
  SearchInput,
  TagChip,
  ValidationError,
} from '@/features/restaurant'

export const metadata = { title: '해시태그 검색 · 점메추' }
export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ tag?: string }> }

export default async function RestaurantSearchPage({ searchParams }: Props) {
  const { tag } = await searchParams
  const tagRaw = (tag ?? '').trim()

  let restaurants: Awaited<ReturnType<typeof searchRestaurantsByTag>> = []
  let normalizedLabel: string | null = null
  let error: string | null = null

  if (tagRaw.length > 0) {
    try {
      restaurants = await searchRestaurantsByTag(tagRaw)
      // 입력 정규화된 결과 표시용
      normalizedLabel = tagRaw.replace(/^#/, '').trim().toLowerCase()
    } catch (e) {
      if (e instanceof ValidationError) error = '태그를 입력해주세요'
      else throw e
    }
  }

  // 빈 진입 시 인기 태그 칩 노출
  const popularTags = tagRaw.length === 0 ? await getPopularTags(20) : []

  return (
    <div className="flex flex-col gap-4 py-4">
      <header className="px-2">
        <h1 className="text-2xl font-bold text-ink">해시태그 검색</h1>
        {normalizedLabel && (
          <p className="text-sm text-ink-secondary mt-1">
            <span className="font-semibold text-ink">#{normalizedLabel}</span> 검색 결과 ·{' '}
            {restaurants.length}곳
          </p>
        )}
      </header>

      <SearchInput initialValue={tagRaw.replace(/^#/, '')} />

      {error && (
        <div className="rounded-2xl bg-surface-primary p-4 text-sm text-category-han">{error}</div>
      )}

      {tagRaw.length === 0 ? (
        <section className="rounded-2xl bg-surface-primary p-4 shadow-card">
          <h2 className="text-sm font-semibold text-ink mb-3">인기 태그</h2>
          {popularTags.length === 0 ? (
            <p className="text-xs text-ink-muted">아직 등록된 태그가 없습니다</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {popularTags.map((t) => (
                <TagChip key={t.id} label={t.label} count={t.usageCount} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <RestaurantList
          restaurants={restaurants}
          emptyMessage={`#${normalizedLabel ?? tagRaw} 태그가 달린 식당이 없습니다`}
        />
      )}
    </div>
  )
}
