'use client'
// RestaurantMarker — Functional Design §4.13
// 현 단계는 NaverMap 이 자체 `new naver.maps.Marker(...)` 를 사용하므로
// 이 컴포넌트는 *논맵* 환경(예: placeholder 박스 안 식당 리스트)에서 사용하는
// 카테고리 아이콘 표시용 단일 마커 표현으로 단순화한다. (UI.md §3.3 카테고리 색)
import type { RestaurantMapMarker as Marker } from '@/features/restaurant'

const colorByCategory: Record<NonNullable<Marker['category1']>, string> = {
  kor: 'bg-category-han',
  chn: 'bg-category-jung',
  jpn: 'bg-category-il',
  wes: 'bg-category-yang',
}

type Props = { marker: Marker }

export default function RestaurantMarker({ marker }: Props) {
  const dotColor = marker.category1 ? colorByCategory[marker.category1] : 'bg-ink-muted'
  return (
    <div className="inline-flex items-center gap-2 text-xs text-ink-secondary">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotColor}`} aria-hidden />
      <span className="truncate">{marker.name}</span>
      {marker.reservationRequired && <span aria-label="예약 필수">🔒</span>}
    </div>
  )
}
