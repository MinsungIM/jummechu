// T2 지도 탭 — UI.md §3.3
// 서버 컴포넌트에서 식당 마커 로드 + NaverMap 클라이언트 컴포넌트로 전달
import { getAllRestaurantsForMap, getPopularTags, TagChip } from '@/features/restaurant'
import { NaverMap } from '@/features/map'

export const metadata = { title: '지도 · 점메추' }
export const dynamic = 'force-dynamic'

export default async function MapPage() {
  const [markers, popularTags] = await Promise.all([
    getAllRestaurantsForMap(),
    getPopularTags(10),
  ])
  // 지도에 띄울 수 있는 마커 (lat/lng 모두 존재) 만 필터링
  const usableMarkers = markers.filter(
    (m) => typeof m.lat === 'number' && typeof m.lng === 'number'
  )

  return (
    <div className="flex flex-col gap-4 py-4">
      <header className="px-2 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-ink">지도</h1>
        <span className="text-xs text-ink-muted">{usableMarkers.length}곳 표시</span>
      </header>

      {popularTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 px-2 -mx-2">
          {popularTags.map((t) => (
            <TagChip key={t.id} label={t.label} count={t.usageCount} />
          ))}
        </div>
      )}

      <NaverMap markers={usableMarkers} height="calc(100vh - 280px)" />

      {markers.length > usableMarkers.length && (
        <p className="text-xs text-ink-muted px-2">
          위경도 정보가 없는 식당 {markers.length - usableMarkers.length}곳은 지도에 표시되지 않습니다
        </p>
      )}
    </div>
  )
}
