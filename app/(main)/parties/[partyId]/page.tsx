// S2 파티 상세
import { notFound } from 'next/navigation'
import { getParty, PartyDetailView } from '@/features/party'
import { getCurrentUser } from '@/features/auth'

type Props = { params: Promise<{ partyId: string }> }

export const dynamic = 'force-dynamic'

export default async function PartyDetailPage({ params }: Props) {
  const { partyId } = await params
  const id = Number(partyId)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const [party, user] = await Promise.all([getParty(id), getCurrentUser()])
  if (!party) notFound()

  return (
    <div className="flex flex-col gap-4 py-4 px-2">
      <PartyDetailView party={party} currentUserId={user?.id} />
    </div>
  )
}
