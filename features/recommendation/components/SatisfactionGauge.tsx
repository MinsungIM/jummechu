// SatisfactionGauge — 만족도 게이지
// functional-design.md §3
// value: 0~5, count: 평가 수. count=0이면 빈 상태 표시.

type Props = {
  value: number
  count: number
  label?: string
}

export function SatisfactionGauge({ value, count, label = '나의 최근 만족도' }: Props) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100))
  const empty = count === 0

  return (
    <div className="bg-surface-primary rounded-2xl shadow-card p-4 flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-ink-secondary font-semibold">{label}</span>
        <span className="text-xs text-ink-muted">{empty ? '평가 없음' : `${count}건 기준`}</span>
      </div>
      {empty ? (
        <p className="text-sm text-ink-muted">아직 평가가 없어요. 첫 점심을 기록해 보세요!</p>
      ) : (
        <>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-ink">{value.toFixed(1)}</span>
            <span className="text-sm text-ink-muted">/ 5.0</span>
          </div>
          <div
            className="h-2 rounded-pill bg-border-hairline overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={5}
            aria-valuenow={value}
          >
            <div
              className="h-full bg-accent-primary"
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      )}
    </div>
  )
}
