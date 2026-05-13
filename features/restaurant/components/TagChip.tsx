// TagChip — 해시태그 칩 (S1·S8·T2 상단에서 사용)
// UI.md §3.5 / §3.10 — "#가성비" 형태로 표시, 클릭 시 S8 검색
import Link from 'next/link'

type Props = {
  label: string
  count?: number
  active?: boolean
  asLink?: boolean
  href?: string
  onClick?: () => void
}

export function TagChip({ label, count, active = false, asLink = true, href, onClick }: Props) {
  const text = `#${label}`
  const baseClass =
    'inline-flex items-center gap-1 rounded-pill px-3 py-1.5 text-xs font-medium transition shrink-0 ' +
    (active
      ? 'bg-surface-inverse text-ink-inverse'
      : 'bg-surface-secondary text-ink hover:bg-border-subtle')

  const content = (
    <>
      <span className="truncate max-w-[120px]">{text}</span>
      {typeof count === 'number' && count > 0 && (
        <span className="text-[10px] opacity-70">{count}</span>
      )}
    </>
  )

  if (asLink) {
    const url = href ?? `/restaurants/search?tag=${encodeURIComponent(label)}`
    return (
      <Link href={url} className={baseClass}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={baseClass}>
      {content}
    </button>
  )
}
