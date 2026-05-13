// F2 파티 생성 — PartyCreateForm
import { PartyCreateForm } from '@/features/party'

export const metadata = { title: '파티 만들기 · 점메추' }

export default function NewPartyPage() {
  return (
    <div className="flex flex-col gap-4 py-4">
      <h1 className="text-2xl font-bold text-ink px-2">파티 만들기</h1>
      <PartyCreateForm />
    </div>
  )
}
