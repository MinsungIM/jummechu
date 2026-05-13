// RatingItem — 평가 카드 한 건 표시 (Server-friendly)
// functional-design.md §3
import { Card } from '@/components/ui/Card'
import { formatKST } from '@/lib/time'
import { RatingStars } from './RatingStars'

type Props = {
  stars: number | null
  tagLabels?: string[]
  comment?: string | null
  createdAt: number
  title?: string
}

export function RatingItem({ stars, tagLabels, comment, createdAt, title }: Props) {
  return (
    <Card>
      {title && <h3 className="text-sm font-semibold text-ink">{title}</h3>}
      <div className="flex items-center gap-3">
        {stars !== null ? (
          <RatingStars value={stars} readOnly size="md" />
        ) : (
          <span className="text-xs text-ink-muted">별점 없음</span>
        )}
        <span className="text-xs text-ink-muted ml-auto">{formatKST(createdAt)}</span>
      </div>
      {tagLabels && tagLabels.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {tagLabels.map((t) => (
            <li
              key={t}
              className="inline-flex rounded-pill bg-surface-secondary text-ink-secondary px-2.5 py-0.5 text-xs"
            >
              {t}
            </li>
          ))}
        </ul>
      )}
      {comment && <p className="text-sm text-ink-secondary leading-relaxed">{comment}</p>}
    </Card>
  )
}
