// RestaurantList — Restaurant[] 를 카드 리스트로 렌더 + 빈 상태
import { RestaurantCard } from './RestaurantCard'
import type { Restaurant } from '../types'

type Props = {
  restaurants: Restaurant[]
  emptyMessage?: string
}

export function RestaurantList({ restaurants, emptyMessage }: Props) {
  if (restaurants.length === 0) {
    return (
      <div className="rounded-2xl bg-surface-primary p-8 text-center text-sm text-ink-muted">
        {emptyMessage ?? '검색 결과가 없습니다'}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {restaurants.map((r) => (
        <RestaurantCard key={r.id} restaurant={r} />
      ))}
    </div>
  )
}
