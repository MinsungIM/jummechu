// S2 파티 상세 — T-C 트랙 placeholder
type Props = { params: Promise<{ partyId: string }> }

export default async function PartyDetailPage({ params }: Props) {
  const { partyId } = await params
  return (
    <div className="flex flex-col gap-4 py-4">
      <h1 className="text-2xl font-bold text-ink px-2">파티 #{partyId}</h1>
      <div className="p-6 rounded-2xl bg-surface-primary text-ink-muted">
        S2 파티 상세 — 구현 예정 (T-C 트랙)
      </div>
    </div>
  )
}
