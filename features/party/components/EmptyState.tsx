// EmptyState — N6 빈 상태. 오늘 파티 없을 때.
export function EmptyState({ message = '오늘 모집 중인 파티가 없어요' }: { message?: string }) {
  return (
    <div className="rounded-2xl bg-surface-primary p-8 text-center">
      <div className="text-4xl mb-2" aria-hidden>
        🍙
      </div>
      <p className="text-ink-secondary text-sm">{message}</p>
    </div>
  )
}
