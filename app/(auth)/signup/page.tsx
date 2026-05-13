import { SignupForm } from '@/features/auth'

export const metadata = { title: '회원가입 · 점메추' }

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-ink">🍱 점메추</h1>
        <p className="text-sm text-ink-secondary mt-2">사내 점심 모임에 합류하세요</p>
      </div>
      <SignupForm />
    </div>
  )
}
