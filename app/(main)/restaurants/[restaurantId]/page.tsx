// S1 식당 상세 — Functional Design §8 UI 매핑
// 서버 컴포넌트: getRestaurant + getMenusByRestaurant 동시 조회
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getRestaurant,
  getMenusByRestaurant,
  TagChip,
} from '@/features/restaurant'
import { buildNaverDirectionsUrl } from '@/features/map'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ restaurantId: string }> }

const categoryLabel: Record<string, string> = {
  kor: '한식',
  chn: '중식',
  jpn: '일식',
  wes: '양식',
}

const waitLabel: Record<string, string> = {
  light: '한산',
  medium: '중간',
  heavy: '심각',
}

export default async function RestaurantDetailPage({ params }: Props) {
  const { restaurantId } = await params
  const id = Number(restaurantId)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const restaurant = await getRestaurant(id)
  if (!restaurant) notFound()

  const menus = await getMenusByRestaurant(id)

  const directionsUrl =
    restaurant.lat !== null && restaurant.lng !== null
      ? buildNaverDirectionsUrl('current', restaurant.lat, restaurant.lng, restaurant.name)
      : `https://map.naver.com/p/search/${encodeURIComponent(restaurant.name)}`

  return (
    <div className="flex flex-col gap-5 py-4">
      {/* 헤더 */}
      <header className="px-2">
        <h1 className="text-2xl font-bold text-ink">{restaurant.name}</h1>
        {restaurant.address && (
          <p className="text-sm text-ink-secondary mt-1">{restaurant.address}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-ink-secondary">
          {restaurant.category1 && (
            <span className="rounded-pill bg-surface-secondary px-2 py-1">
              {categoryLabel[restaurant.category1]}
              {restaurant.category2 ? ` · ${restaurant.category2}` : ''}
            </span>
          )}
          {restaurant.waitLevel && (
            <span className="rounded-pill bg-surface-secondary px-2 py-1">
              대기 {waitLabel[restaurant.waitLevel]}
            </span>
          )}
          {restaurant.reservationRequired && (
            <span className="rounded-pill bg-surface-secondary px-2 py-1">🔒 예약 필수</span>
          )}
        </div>
      </header>

      {/* 지도 미니뷰 + 길찾기 (placeholder + 외부 링크) */}
      <section className="rounded-2xl bg-surface-primary p-4 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">위치</h2>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold rounded-pill bg-surface-inverse text-ink-inverse px-3 py-1.5"
          >
            길찾기 →
          </a>
        </div>
        <div className="mt-3 h-32 rounded-xl bg-surface-secondary flex items-center justify-center text-xs text-ink-muted">
          {restaurant.lat !== null && restaurant.lng !== null
            ? `위경도 ${restaurant.lat.toFixed(4)}, ${restaurant.lng.toFixed(4)}`
            : '위치 정보 미등록'}
        </div>
      </section>

      {/* 해시태그 */}
      <section className="rounded-2xl bg-surface-primary p-4 shadow-card">
        <h2 className="text-sm font-semibold text-ink mb-3">해시태그</h2>
        {restaurant.tags.length === 0 ? (
          <p className="text-xs text-ink-muted">아직 태그가 없습니다</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {restaurant.tags.map((t) => (
              <TagChip key={t.id} label={t.label} count={t.usageCount} />
            ))}
          </div>
        )}
        <Link
          href={`/restaurants/search?tag=`}
          className="mt-3 inline-block text-xs text-accent-blue hover:underline"
        >
          + 태그 추가하기
        </Link>
      </section>

      {/* 추천 메뉴 리스트 */}
      <section className="rounded-2xl bg-surface-primary p-4 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">추천 메뉴</h2>
          <span className="text-xs text-ink-muted">{menus.length}개</span>
        </div>
        {menus.length === 0 ? (
          <p className="mt-3 text-xs text-ink-muted">아직 메뉴 기록이 없습니다</p>
        ) : (
          <ul className="mt-3 divide-y divide-border-hairline">
            {menus.map((m) => (
              <li key={m.id} className="py-2.5 flex items-center justify-between">
                <span className="text-sm text-ink">{m.name}</span>
                <span className="text-xs text-ink-secondary">
                  {m.price !== null ? `${m.price.toLocaleString()}원` : '가격 미정'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 평가 (T-D placeholder) */}
      <section className="rounded-2xl bg-surface-primary p-4 shadow-card">
        <h2 className="text-sm font-semibold text-ink">식당 만족도</h2>
        <p className="mt-2 text-xs text-ink-muted">
          평가 기능은 곧 추가될 예정입니다 (다녀온 파티 참여자만)
        </p>
      </section>

      {/* CTA */}
      <div className="px-2">
        <Link
          href={`/parties/new?restaurantId=${restaurant.id}`}
          className="block w-full text-center rounded-pill bg-accent-primary text-accent-onPrimary py-3 text-sm font-bold"
        >
          여기서 파티 만들기
        </Link>
      </div>
    </div>
  )
}
