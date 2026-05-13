import type { ReactNode } from 'react'

// (auth) 그룹: 로그인·회원가입 화면. 탭바 없음, 단순 중앙 정렬.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-ground">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  )
}
