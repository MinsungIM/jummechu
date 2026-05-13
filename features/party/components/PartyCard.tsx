// PartyCard — mock_uiux/jummechu.pen comp_PartyCard (ytr0D) 시각 변환
// .pen 구조: top(title_wrap + time_chip) / meta(cat + menu + price) / foot(people + 합류 btn)
import Link from 'next/link'
import { CategoryChip } from './CategoryChip'
import { TimeChip } from './TimeChip'
import type { PartyCard as PartyCardType } from '../types'

type Props = { party: PartyCardType }

export function PartyCard({ party }: Props) {
  const remaining = party.capacity - party.currentCount
  const isFull = remaining <= 0
  return (
    <Link
      href={`/parties/${party.id}`}
      className="block rounded-2xl bg-surface-primary p-4 shadow-card transition hover:shadow-tab"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {party.isSilent && <span className="text-base shrink-0">🤫</span>}
          <h3 className="text-base font-bold text-ink truncate">{party.name}</h3>
        </div>
        <TimeChip ts={party.departAt} />
      </div>

      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <CategoryChip name={party.restaurantName ?? '메뉴 미정'} />
        {party.priceBand && (
          <>
            <span className="text-ink-muted text-sm">·</span>
            <span className="text-ink-secondary text-sm">{party.priceBand}</span>
          </>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-ink-secondary">
          <span aria-hidden>👥</span>
          <span>
            {party.currentCount}/{party.capacity}명
          </span>
          {!isFull && <span className="text-accent-blue ml-1">{remaining}자리</span>}
        </div>
        <div
          className={
            'rounded-pill px-4 py-2 text-sm font-medium ' +
            (isFull
              ? 'bg-surface-secondary text-ink-muted'
              : 'bg-surface-inverse text-ink-inverse')
          }
        >
          {isFull ? '마감' : '합류'}
        </div>
      </div>
    </Link>
  )
}
