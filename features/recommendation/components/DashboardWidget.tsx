// DashboardWidget — T1 홈 상단 위젯 (Server Component)
// functional-design.md §3 + §9. 자체 fetch 안 함 — 서버 함수 직접 호출.
// 호출자: app/(main)/page.tsx (T-C 소유) — parent가 머지 시 import 추가.
import { recommendForUser } from '../server/recommendForUser'
import { getDailySatisfaction } from '../server/getDailySatisfaction'
import { SatisfactionGauge } from './SatisfactionGauge'
import { requireUser } from '@/features/auth'

const RECOMMENDATION_COUNT = 3

export async function DashboardWidget() {
  const user = await requireUser()

  const [items, satisfaction] = await Promise.all([
    recommendForUser(user.id, RECOMMENDATION_COUNT),
    getDailySatisfaction(user.id),
  ])

  return (
    <section className="flex flex-col gap-3" aria-label="오늘의 추천 위젯">
      <SatisfactionGauge value={satisfaction?.avgStars ?? 0} count={satisfaction?.count ?? 0} />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-ink-secondary px-1">오늘의 추천</h2>
        {items.length === 0 ? (
          <p className="text-sm text-ink-muted px-1">추천할 식당이 아직 없어요. 점심을 다녀온 뒤 평가를 남겨주세요!</p>
        ) : (
          <ul className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-1">
            {items.map((it) => (
              <li
                key={it.restaurantId}
                className="min-w-[160px] flex-shrink-0 bg-surface-primary rounded-2xl shadow-card p-3 flex flex-col gap-1"
              >
                <span className="text-xs text-ink-muted">{reasonLabel(it.reason)}</span>
                <span className="text-sm font-semibold text-ink leading-tight">{it.restaurantName}</span>
                {it.score > 0 && (
                  <span className="text-xs text-accent-primary font-semibold">
                    ★ {it.score.toFixed(1)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function reasonLabel(reason: string): string {
  switch (reason) {
    case 'high_rated':
      return '만족도 높음'
    case 'unvisited':
      return '아직 안 가본 곳'
    case 'random':
      return '오늘은 어때요?'
    default:
      return '추천'
  }
}
