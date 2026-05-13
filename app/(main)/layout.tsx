import type { ReactNode } from 'react'
import Link from 'next/link'
import { Suspense } from 'react'
import { FloatingTabBar } from '@/components/layout/FloatingTabBar'
import { NotificationBadge, InAppBanner } from '@/features/notification'

// (main) 그룹: 미들웨어가 미인증을 /login으로 리다이렉트.
// - 상단 sticky header: 로고 + 알림 종 (NotificationBadge)
// - 그 아래 InAppBanner (B4 출발 임박, dismiss 가능)
// - 본문 + 하단 FloatingTabBar
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ground">
      <header className="sticky top-0 z-30 bg-ground/95 backdrop-blur supports-[backdrop-filter]:bg-ground/80">
        <div className="mx-auto w-full max-w-[480px] px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight text-ink">
            점메추
          </Link>
          <Suspense
            fallback={
              <span
                aria-hidden
                className="inline-flex h-10 w-10 items-center justify-center"
              />
            }
          >
            {/* NotificationBadge는 async Server Component */}
            <NotificationBadge />
          </Suspense>
        </div>
        <InAppBanner />
      </header>
      <main className="mx-auto w-full max-w-[480px] min-h-screen pb-32 pt-2 px-4">
        {children}
      </main>
      <FloatingTabBar />
    </div>
  )
}
