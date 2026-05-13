// S1 식당 상세 — T-B 트랙 placeholder
type Props = { params: Promise<{ restaurantId: string }> }

export default async function RestaurantDetailPage({ params }: Props) {
  const { restaurantId } = await params
  return (
    <div className="flex flex-col gap-4 py-4">
      <h1 className="text-2xl font-bold text-ink px-2">식당 #{restaurantId}</h1>
      <div className="p-6 rounded-2xl bg-surface-primary text-ink-muted">
        S1 식당 상세 — 구현 예정 (T-B 트랙 + T-D 평가)
      </div>
    </div>
  )
}
