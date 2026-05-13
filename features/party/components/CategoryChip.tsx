// CategoryChip — .pen meta.cat 변환. 카테고리 키워드 색상 매핑.
type Props = { name: string; category?: 'han' | 'jung' | 'il' | 'yang' }

const COLOR_MAP: Record<NonNullable<Props['category']>, string> = {
  han: 'text-category-han',
  jung: 'text-category-jung',
  il: 'text-category-il',
  yang: 'text-category-yang',
}

export function CategoryChip({ name, category }: Props) {
  const color = category ? COLOR_MAP[category] : 'text-ink-secondary'
  return (
    <span className={`inline-flex items-center rounded-pill bg-surface-secondary px-3 py-1 text-sm font-medium ${color}`}>
      {name}
    </span>
  )
}
