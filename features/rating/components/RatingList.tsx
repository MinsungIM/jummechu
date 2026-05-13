// RatingList — RatingItem 리스트 + 빈 상태
// functional-design.md §3
import { RatingItem } from './RatingItem'

export type RatingListEntry = {
  key: string | number
  stars: number | null
  tagLabels?: string[]
  comment?: string | null
  createdAt: number
  title?: string
}

type Props = {
  entries: RatingListEntry[]
  emptyText?: string
}

export function RatingList({ entries, emptyText = '아직 평가가 없습니다.' }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-center text-sm text-ink-muted py-8">{emptyText}</div>
    )
  }
  return (
    <ul className="flex flex-col gap-3">
      {entries.map((e) => (
        <li key={e.key}>
          <RatingItem
            stars={e.stars}
            tagLabels={e.tagLabels}
            comment={e.comment}
            createdAt={e.createdAt}
            title={e.title}
          />
        </li>
      ))}
    </ul>
  )
}
