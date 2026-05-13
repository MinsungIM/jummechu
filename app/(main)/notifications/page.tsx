// 알림 페이지 — 인증 필요. middleware가 (main) 미인증을 /login 으로 리다이렉트.
import { requireUser, UnauthorizedError } from '@/features/auth'
import { listMy, NotificationList } from '@/features/notification'
import { redirect } from 'next/navigation'

export const metadata = { title: '알림 · 점메추' }
export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 30

export default async function NotificationsPage() {
  let userId: number
  try {
    const user = await requireUser()
    userId = user.id
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      redirect('/login')
    }
    throw e
  }

  const items = await listMy(userId, DEFAULT_LIMIT)

  return (
    <div className="flex flex-col gap-4 py-4">
      <header className="px-2">
        <h1 className="text-2xl font-bold text-ink">알림</h1>
        <p className="text-sm text-ink-secondary mt-1">최근 {DEFAULT_LIMIT}건</p>
      </header>
      <NotificationList notifications={items} />
    </div>
  )
}
