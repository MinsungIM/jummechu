// T1 파티 리스트 (대시보드 통합) — T-C 트랙이 실제 컨텐츠 구현
export const metadata = { title: '파티 · 점메추' }

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6 py-4">
      <header className="px-2">
        <h1 className="text-2xl font-bold text-ink">오늘의 점심</h1>
        <p className="text-sm text-ink-secondary mt-1">모집 중인 파티가 있나요?</p>
      </header>

      {/* TODO T-C 트랙: 대시보드(추천·만족도) + 해시태그 칩 필터 + 파티 카드 리스트 */}
      <div className="p-6 rounded-2xl bg-surface-primary text-center text-ink-muted">
        T1 파티 리스트 — 구현 예정 (T-C 트랙)
      </div>
    </div>
  )
}
