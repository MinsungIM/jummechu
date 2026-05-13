// S3 히스토리 목록
import Link from 'next/link'
import { listMyHistory } from '@/features/party'
import { getCurrentUser } from '@/features/auth'
import { formatKST } from '@/lib/time'
import { redirect } from 'next/navigation'

export const metadata = { title: '히스토리 · 점메추' }

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const items = await listMyHistory(user.id)

  return (
    <div className="flex flex-col gap-4 py-4">
      <h1 className="text-2xl font-bold text-ink px-2">히스토리</h1>
      {items.length === 0 ? (
        <div className="rounded-2xl bg-surface-primary p-8 text-center">
          <div className="text-4xl mb-2" aria-hidden>
            📒
          </div>
          <p className="text-ink-secondary text-sm">아직 참여한 파티 기록이 없어요</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 px-2">
          {items.map((it) => (
            <li key={it.id}>
              <Link
                href={`/history/${it.id}`}
                className="block rounded-2xl bg-surface-primary p-4 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-ink">{it.name}</div>
                  <div className="text-xs text-ink-muted">{formatKST(it.departAt)}</div>
                </div>
                <div className="text-sm text-ink-secondary mt-1">
                  {it.restaurantName ?? '메뉴 미정'} · {it.memberCount}명
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
