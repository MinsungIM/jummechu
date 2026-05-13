'use client'
// F2 파티 생성 폼 — 클라이언트 컴포넌트. POST /api/parties.
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type FieldErrors = Record<string, string>

function tsFromLocal(value: string): number {
  // datetime-local → 사용자 로컬 timezone 그대로 unix ms 변환 (브라우저=KST 가정)
  return new Date(value).getTime()
}

export function PartyCreateForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [globalError, setGlobalError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setFieldErrors({})
    setGlobalError(null)

    const form = e.currentTarget
    const fd = new FormData(form)
    const departAtRaw = String(fd.get('departAt') ?? '')
    const joinUntilRaw = String(fd.get('joinUntil') ?? '')

    const payload = {
      name: String(fd.get('name') ?? '').trim(),
      restaurantId: null,
      restaurantNameFreetext: String(fd.get('restaurantNameFreetext') ?? '').trim() || undefined,
      departAt: departAtRaw ? tsFromLocal(departAtRaw) : 0,
      joinUntil: joinUntilRaw ? tsFromLocal(joinUntilRaw) : 0,
      place: String(fd.get('place') ?? '').trim() || null,
      priceBand: String(fd.get('priceBand') ?? '').trim() || null,
      capacity: Number(fd.get('capacity') ?? 0),
      rules: String(fd.get('rules') ?? '').trim() || undefined,
      isSilent: fd.get('isSilent') === 'on',
      extraSchedule: String(fd.get('extraSchedule') ?? '').trim() || undefined,
    }

    try {
      const res = await fetch('/api/parties', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as
        | { data: { id: number } }
        | { error: { code: string; message: string; fieldErrors?: FieldErrors } }
      if (!res.ok || 'error' in json) {
        const errPayload = 'error' in json ? json.error : { code: 'UNKNOWN', message: '알 수 없는 오류' }
        if (errPayload.fieldErrors) setFieldErrors(errPayload.fieldErrors)
        setGlobalError(errPayload.message)
        return
      }
      router.push(`/parties/${json.data.id}`)
      router.refresh()
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : '네트워크 오류')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-24">
      <Input name="name" label="파티 이름 *" placeholder="예) 든든한 점심" required error={fieldErrors.name} />
      <Input
        name="restaurantNameFreetext"
        label="메뉴 / 식당 *"
        placeholder="예) 김밥천국"
        required
        error={fieldErrors.restaurantNameFreetext}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          name="departAt"
          label="출발 시각 *"
          type="datetime-local"
          required
          error={fieldErrors.departAt}
        />
        <Input
          name="joinUntil"
          label="합류 마감 *"
          type="datetime-local"
          required
          error={fieldErrors.joinUntil}
        />
      </div>

      <Input
        name="capacity"
        label="정원 *"
        type="number"
        min={2}
        max={50}
        defaultValue={4}
        required
        error={fieldErrors.capacity}
      />

      <Input name="place" label="만남 장소" placeholder="예) 1층 로비" />
      <Input name="priceBand" label="가격대" placeholder="예) 1만원대" />

      <details className="rounded-2xl bg-surface-primary p-4">
        <summary className="text-sm font-semibold text-ink cursor-pointer">추가 옵션</summary>
        <div className="flex flex-col gap-3 mt-3">
          <Input name="rules" label="파티 규칙" placeholder="예) 1만원 이하만" />
          <Input name="extraSchedule" label="추가 일정" placeholder="예) 식후 카페" />
          <label className="flex items-center gap-2 px-1">
            <input name="isSilent" type="checkbox" className="size-4 accent-accent-primary" />
            <span className="text-sm text-ink">🤫 조용한 식사 모임</span>
          </label>
        </div>
      </details>

      {globalError && (
        <div className="rounded-xl bg-category-han/10 px-4 py-3 text-sm text-category-han">{globalError}</div>
      )}

      <div className="fixed bottom-24 left-0 right-0 px-4 max-w-md mx-auto">
        <Button type="submit" variant="dark" size="lg" pill disabled={submitting} className="w-full">
          {submitting ? '생성 중…' : '파티 만들기'}
        </Button>
      </div>
    </form>
  )
}
