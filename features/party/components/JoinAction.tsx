'use client'
// JoinAction — S2 파티 상세 우하단 액션. 합류/탈퇴 토글.
// M9 합류 확인 모달: confirm(window.confirm)로 간이 구현. 정식 Modal은 후속.
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

type Props = {
  partyId: number
  isMember: boolean
  isOwner: boolean
  isFull: boolean
  isOpen: boolean
}

export function JoinAction({ partyId, isMember, isOwner, isFull, isOpen }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (isOwner) {
    return (
      <div className="rounded-pill bg-accent-primary/20 px-4 py-2 text-sm text-ink text-center">
        방장입니다 (취소는 다음 업데이트)
      </div>
    )
  }
  if (!isOpen) {
    return (
      <div className="rounded-pill bg-surface-secondary px-4 py-2 text-sm text-ink-muted text-center">
        모집이 종료되었어요
      </div>
    )
  }
  if (isMember) {
    return (
      <div className="flex flex-col gap-2">
        {error && <p className="text-xs text-category-han px-1">{error}</p>}
        <Button
          variant="secondary"
          size="lg"
          pill
          className="w-full"
          disabled={pending}
          onClick={() => {
            if (!confirm('파티에서 나가시겠어요?')) return
            setError(null)
            start(async () => {
              const res = await fetch(`/api/parties/${partyId}/members/me`, { method: 'DELETE' })
              const json = await res.json()
              if (!res.ok) {
                setError(json?.error?.message ?? '오류')
                return
              }
              router.refresh()
            })
          }}
        >
          {pending ? '처리 중…' : '나가기'}
        </Button>
      </div>
    )
  }
  if (isFull) {
    return (
      <div className="rounded-pill bg-surface-secondary px-4 py-2 text-sm text-ink-muted text-center">
        마감되었어요
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-xs text-category-han px-1">{error}</p>}
      <Button
        variant="dark"
        size="lg"
        pill
        className="w-full"
        disabled={pending}
        onClick={() => {
          if (!confirm('이 파티에 합류할까요?')) return
          setError(null)
          start(async () => {
            const res = await fetch(`/api/parties/${partyId}/members`, { method: 'POST' })
            const json = await res.json()
            if (!res.ok) {
              setError(json?.error?.message ?? '오류')
              return
            }
            router.refresh()
          })
        }}
      >
        {pending ? '처리 중…' : '합류하기'}
      </Button>
    </div>
  )
}
