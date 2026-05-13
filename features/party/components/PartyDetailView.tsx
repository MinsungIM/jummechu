// S2 파티 상세 — read-only 뷰. 합류·공지·취소는 sub-batch 2/3.
import { formatTimeKST, formatKST } from '@/lib/time'
import { TimeChip } from './TimeChip'
import type { PartyDetail } from '../types'

type Props = { party: PartyDetail; currentUserId?: number }

export function PartyDetailView({ party }: Props) {
  const remaining = party.capacity - party.currentCount
  const isFull = remaining <= 0
  const status = party.status

  return (
    <div className="flex flex-col gap-4">
      {/* Top */}
      <section className="rounded-2xl bg-surface-primary p-4 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {party.isSilent && <span className="text-base shrink-0">🤫</span>}
            <h1 className="text-xl font-bold text-ink truncate">{party.name}</h1>
          </div>
          <TimeChip ts={party.departAt} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-sm text-ink-secondary">
          <span>🍴 {party.restaurant?.name ?? party.restaurantNameFreetext ?? '메뉴 미정'}</span>
          {party.priceBand && <span>· 💰 {party.priceBand}</span>}
          {party.place && <span>· 📍 {party.place}</span>}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-ink-secondary">
            👥 {party.currentCount}/{party.capacity}명
            {!isFull && status === 'open' && <span className="text-accent-blue ml-2">{remaining}자리</span>}
          </div>
          <StatusBadge status={status} />
        </div>
      </section>

      {/* Notice */}
      {party.notice && (
        <section className="rounded-2xl bg-accent-primary/10 p-4">
          <div className="text-xs font-semibold text-ink-secondary mb-1">📢 공지</div>
          <p className="text-sm text-ink whitespace-pre-wrap">{party.notice}</p>
        </section>
      )}

      {/* Rules / extra */}
      {(party.rules || party.extraSchedule) && (
        <section className="rounded-2xl bg-surface-primary p-4">
          {party.rules && (
            <div className="mb-2">
              <div className="text-xs font-semibold text-ink-secondary mb-1">규칙</div>
              <p className="text-sm text-ink whitespace-pre-wrap">{party.rules}</p>
            </div>
          )}
          {party.extraSchedule && (
            <div>
              <div className="text-xs font-semibold text-ink-secondary mb-1">추가 일정</div>
              <p className="text-sm text-ink whitespace-pre-wrap">{party.extraSchedule}</p>
            </div>
          )}
        </section>
      )}

      {/* Members */}
      <section className="rounded-2xl bg-surface-primary p-4">
        <div className="text-xs font-semibold text-ink-secondary mb-2">참여자 ({party.currentCount})</div>
        <ul className="flex flex-col gap-2">
          {party.members.map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-sm text-ink">
              <span className="size-7 rounded-full bg-surface-secondary flex items-center justify-center text-xs font-bold">
                {m.name.slice(0, 1)}
              </span>
              <span>{m.name}</span>
              {m.id === party.ownerId && (
                <span className="ml-1 text-xs text-accent-onPrimary bg-accent-primary rounded-pill px-2 py-0.5">
                  방장
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Meta */}
      <section className="text-xs text-ink-muted px-2">
        <span>모집 마감: {formatKST(party.joinUntil)}</span>
        <span className="mx-2">·</span>
        <span>출발: {formatTimeKST(party.departAt)}</span>
      </section>

      {/* 합류 액션은 sub-batch 2 에서 추가 (JoinAction client component) */}
    </div>
  )
}

function StatusBadge({ status }: { status: 'open' | 'closed' | 'cancelled' }) {
  if (status === 'open') {
    return <span className="text-xs rounded-pill bg-category-il/10 text-category-il px-2 py-0.5">모집중</span>
  }
  if (status === 'closed') {
    return <span className="text-xs rounded-pill bg-surface-secondary text-ink-muted px-2 py-0.5">마감</span>
  }
  return <span className="text-xs rounded-pill bg-category-han/10 text-category-han px-2 py-0.5">취소됨</span>
}
