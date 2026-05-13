// F2 파티 생성 — PartyCreateForm. ?reclone=ID 쿼리 시 prefill.
import { PartyCreateForm, getPartyForReclone } from '@/features/party'

export const metadata = { title: '파티 만들기 · 점메추' }

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ reclone?: string }> }

export default async function NewPartyPage({ searchParams }: Props) {
  const { reclone } = await searchParams
  let prefill = undefined
  if (reclone) {
    const id = Number(reclone)
    if (Number.isInteger(id) && id > 0) {
      try {
        prefill = await getPartyForReclone(id)
      } catch {
        prefill = undefined
      }
    }
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <h1 className="text-2xl font-bold text-ink px-2">파티 만들기</h1>
      <PartyCreateForm prefill={prefill} />
    </div>
  )
}
