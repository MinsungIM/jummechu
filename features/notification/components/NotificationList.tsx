// NotificationList — 알림 리스트 + 전체 읽음 버튼 (Client wrapper)
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Notification } from '../types'
import { NotificationItem } from './NotificationItem'

type Props = {
  notifications: Notification[]
}

export function NotificationList({ notifications }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const hasUnread = notifications.some((n) => !n.isRead)

  const onMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
    } catch {
      /* swallow — 다음 진입 시 서버 권위 있음 */
    }
    startTransition(() => router.refresh())
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-2xl bg-surface-primary p-8 text-center">
        <div className="text-4xl mb-2" aria-hidden>
          🔔
        </div>
        <p className="text-ink-secondary text-sm">알림이 없어요.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {hasUnread && (
        <div className="flex justify-end px-1">
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={pending}
            className="text-xs font-semibold text-ink-secondary hover:text-ink transition disabled:opacity-50"
          >
            모두 읽음 표시
          </button>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {notifications.map((n) => (
          <li key={n.id}>
            <NotificationItem notification={n} />
          </li>
        ))}
      </ul>
    </div>
  )
}
