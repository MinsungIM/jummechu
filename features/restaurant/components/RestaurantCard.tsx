// RestaurantCard — 식당 리스트 카드 (S8 검색 결과, S6 만족도 리스트 등)
import Link from 'next/link'
import { TagChip } from './TagChip'
import type { Restaurant } from '../types'

const categoryLabel: Record<NonNullable<Restaurant['category1']>, string> = {
  kor: '한식',
  chn: '중식',
  jpn: '일식',
  wes: '양식',
}

const categoryColor: Record<NonNullable<Restaurant['category1']>, string> = {
  kor: 'bg-category-han/15 text-category-han',
  chn: 'bg-category-jung/15 text-category-jung',
  jpn: 'bg-category-il/15 text-category-il',
  wes: 'bg-category-yang/15 text-category-yang',
}

const waitLabel: Record<NonNullable<Restaurant['waitLevel']>, string> = {
  light: '한산',
  medium: '중간',
  heavy: '심각',
}

type Props = { restaurant: Restaurant }

export function RestaurantCard({ restaurant: r }: Props) {
  return (
    <Link
      href={`/restaurants/${r.id}`}
      className="block rounded-2xl bg-surface-primary p-4 shadow-card transition hover:shadow-tab"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-ink truncate">{r.name}</h3>
          {r.address && <p className="text-xs text-ink-muted truncate mt-0.5">{r.address}</p>}
        </div>
        {r.category1 && (
          <span className={`shrink-0 rounded-pill px-2 py-0.5 text-[11px] font-semibold ${categoryColor[r.category1]}`}>
            {categoryLabel[r.category1]}
            {r.category2 ? ` · ${r.category2}` : ''}
          </span>
        )}
      </div>

      {(r.waitLevel || r.reservationRequired) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-ink-secondary">
          {r.waitLevel && <span>대기 {waitLabel[r.waitLevel]}</span>}
          {r.reservationRequired && <span>🔒 예약 필수</span>}
        </div>
      )}

      {r.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {r.tags.slice(0, 5).map((t) => (
            <TagChip key={t.id} label={t.label} count={t.usageCount} />
          ))}
          {r.tags.length > 5 && (
            <span className="text-xs text-ink-muted self-center">+{r.tags.length - 5}</span>
          )}
        </div>
      )}
    </Link>
  )
}
