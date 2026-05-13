import { Suspense } from 'react'
import { LoginForm } from '@/features/auth'

export const metadata = { title: '로그인 · 점메추' }

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-ink">🍱 점메추</h1>
        <p className="text-sm text-ink-secondary mt-2">점심 메뉴 추천 시스템</p>
      </div>
      <Suspense fallback={<div className="h-12" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
