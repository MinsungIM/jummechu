// S2 파티 상세 + 합류/탈퇴 액션
import { notFound } from 'next/navigation'
import { getParty, getMembership, PartyDetailView, JoinAction } from '@/features/party'
import { getCurrentUser } from '@/features/auth'

type Props = { params: Promise<{ partyId: string }> }

export const dynamic = 'force-dynamic'

export default async function PartyDetailPage({ params }: Props) {
  const { partyId } = await params
  const id = Number(partyId)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const [party, user] = await Promise.all([getParty(id), getCurrentUser()])
  if (!party) notFound()

  const membership = user ? await getMembership(party.id, user.id) : null
  const isMember = !!membership
  const isOwner = user?.id === party.ownerId
  const isFull = party.currentCount >= party.capacity
  const isOpen = party.status === 'open'

  return (
    <div className="flex flex-col gap-4 py-4 px-2 pb-32">
      <PartyDetailView party={party} currentUserId={user?.id} />
      {user && (
        <div className="fixed bottom-24 left-0 right-0 px-4 max-w-md mx-auto">
          <JoinAction
            partyId={party.id}
            isMember={isMember}
            isOwner={isOwner}
            isFull={isFull}
            isOpen={isOpen}
          />
        </div>
      )}
    </div>
  )
}
