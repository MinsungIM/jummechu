// TimeChip — .pen top.time_chip 변환. yellow pill, KST 시각 표시.
import { formatTimeKST } from '@/lib/time'

type Props = { ts: number }

export function TimeChip({ ts }: Props) {
  return (
    <span className="rounded-pill bg-accent-primary px-3 py-1 text-sm font-bold text-accent-onPrimary shrink-0">
      {formatTimeKST(ts)}
    </span>
  )
}
