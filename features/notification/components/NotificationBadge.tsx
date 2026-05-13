// NotificationBadge — 헤더에 종 아이콘 + unread 개수 (Server Component)
// (main) layout 상단에 마운트. 미인증 시 종만 보여주고 카운트 숨김.
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { getCurrentUser } from '@/features/auth'
import { listMyUnread } from '../server/listMyUnread'

const MAX_DISPLAY = 99

export async function NotificationBadge() {
  const user = await getCurrentUser()
  let unread = 0
  if (user) {
    try {
      const items = await listMyUnread(user.id)
      unread = items.length
    } catch {
      unread = 0
    }
  }

  const showBadge = unread > 0
  const displayCount = unread > MAX_DISPLAY ? `${MAX_DISPLAY}+` : String(unread)

  return (
    <Link
      href="/notifications"
      aria-label={showBadge ? `알림 ${unread}개` : '알림'}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-secondary transition"
    >
      <Bell className="text-ink" size={20} strokeWidth={2.2} />
      {showBadge && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-primary text-accent-onPrimary text-[10px] font-bold flex items-center justify-center"
          aria-hidden
        >
          {displayCount}
        </span>
      )}
    </Link>
  )
}
