// S4 히스토리 상세 + 재파티 진입점
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getParty, PartyDetailView } from '@/features/party'

type Props = { params: Promise<{ partyId: string }> }

export const dynamic = 'force-dynamic'

export default async function HistoryDetailPage({ params }: Props) {
  const { partyId } = await params
  const id = Number(partyId)
  if (!Number.isInteger(id) || id <= 0) notFound()
  const party = await getParty(id)
  if (!party) notFound()

  return (
    <div className="flex flex-col gap-4 py-4 px-2 pb-32">
      <PartyDetailView party={party} />
      <div className="fixed bottom-24 left-0 right-0 px-4 max-w-md mx-auto">
        <Link
          href={`/parties/new?reclone=${id}`}
          className="block rounded-pill bg-accent-primary text-accent-onPrimary text-center py-3 font-semibold"
        >
          🔁 같은 파티로 다시 만들기
        </Link>
      </div>
    </div>
  )
}
