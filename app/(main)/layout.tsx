import type { ReactNode } from 'react'
import { FloatingTabBar } from '@/components/layout/FloatingTabBar'

// (main) 그룹: 미들웨어가 미인증을 /login으로 리다이렉트.
// 화면은 모바일 393×852 컨테이너 + 하단 플로팅 탭바.
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ground">
      <main className="mx-auto w-full max-w-[480px] min-h-screen pb-32 pt-2 px-4">
        {children}
      </main>
      <FloatingTabBar />
    </div>
  )
}
