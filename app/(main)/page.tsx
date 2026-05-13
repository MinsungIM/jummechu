// T1 파티 리스트 — 오늘의 모집 중인 파티
import Link from 'next/link'
import { listOpenParties, PartyCardView, EmptyState } from '@/features/party'

export const metadata = { title: '파티 · 점메추' }

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const parties = await listOpenParties({})
  return (
    <div className="flex flex-col gap-6 py-4">
      <header className="px-2">
        <h1 className="text-2xl font-bold text-ink">오늘의 점심</h1>
        <p className="text-sm text-ink-secondary mt-1">모집 중인 파티가 있나요?</p>
      </header>

      {parties.length === 0 ? (
        <EmptyState message="오늘 모집 중인 파티가 없어요. 직접 만들어볼까요?" />
      ) : (
        <ul className="flex flex-col gap-3">
          {parties.map((p) => (
            <li key={p.id}>
              <PartyCardView party={p} />
            </li>
          ))}
        </ul>
      )}

      <div className="px-2">
        <Link
          href="/parties/new"
          className="block rounded-pill bg-surface-inverse text-ink-inverse text-center py-3 font-semibold"
        >
          + 새 파티 만들기
        </Link>
      </div>
    </div>
  )
}
