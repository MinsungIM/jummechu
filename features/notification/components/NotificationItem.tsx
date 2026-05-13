'use client'
// NotificationItem — 개별 알림 카드 (Client)
// 클릭 시 markRead API 호출 + url 이 있으면 router.push
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { Notification, NotificationKind } from '../types'

const KIND_LABEL: Record<NotificationKind, string> = {
  depart_soon: '출발 임박',
  notice: '공지',
  cancelled: '취소',
  system: '시스템',
}

const KIND_DOT: Record<NotificationKind, string> = {
  depart_soon: 'bg-accent-primary',
  notice: 'bg-accent-blue',
  cancelled: 'bg-category-han',
  system: 'bg-ink-muted',
}

function timeAgo(ts: number, now = Date.now()): string {
  const diff = Math.max(0, now - ts)
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  return `${d}일 전`
}

type Props = {
  notification: Notification
}

export function NotificationItem({ notification }: Props) {
  const router = useRouter()
  const [optimisticRead, setOptimisticRead] = useState(notification.isRead)
  const [, startTransition] = useTransition()

  const onClick = () => {
    if (!optimisticRead) {
      setOptimisticRead(true)
      // fire-and-forget — 실패해도 다음 페이지 진입 시 서버 상태가 권위 있음
      fetch(`/api/notifications/${notification.id}/read`, { method: 'POST' }).catch(() => {
        /* swallow */
      })
    }
    if (notification.url) {
      startTransition(() => {
        router.push(notification.url as string)
      })
    } else {
      router.refresh()
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 transition flex gap-3 items-start ${
        optimisticRead ? 'bg-surface-secondary' : 'bg-surface-primary shadow-card'
      }`}
    >
      <span
        className={`shrink-0 mt-1.5 inline-block h-2 w-2 rounded-full ${
          optimisticRead ? 'bg-border-subtle' : KIND_DOT[notification.kind]
        }`}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            {KIND_LABEL[notification.kind]}
          </span>
          <span className="text-[11px] text-ink-muted">{timeAgo(notification.createdAt)}</span>
        </div>
        <p
          className={`text-sm font-semibold truncate ${
            optimisticRead ? 'text-ink-secondary' : 'text-ink'
          }`}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-ink-secondary mt-1 line-clamp-2">{notification.body}</p>
        )}
      </div>
    </button>
  )
}
