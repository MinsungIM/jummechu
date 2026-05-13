// T3 설정 — 로그아웃·패스워드 변경은 M1 실제 구현. 그 외는 stub.
import { getCurrentUser, LogoutButton, ChangePasswordForm } from '@/features/auth'
import { Card } from '@/components/ui/Card'

export const metadata = { title: '설정 · 점메추' }

export default async function SettingsPage() {
  const user = await getCurrentUser()
  return (
    <div className="flex flex-col gap-6 py-4">
      <header className="px-2">
        <h1 className="text-2xl font-bold text-ink">설정</h1>
      </header>

      {/* 프로필 — 이름·이메일·로그아웃 (M1 실제 구현) */}
      <Card>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-ink-muted">이름</p>
          <p className="text-base text-ink">{user?.name ?? '-'}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-ink-muted">이메일</p>
          <p className="text-base text-ink">{user?.email ?? '-'}</p>
        </div>
        <div className="mt-2">
          <LogoutButton />
        </div>
      </Card>

      {/* 패스워드 변경 (M1 실제 구현) */}
      <Card>
        <h2 className="text-lg font-semibold text-ink">패스워드 변경</h2>
        <ChangePasswordForm />
      </Card>

      {/* TODO T-A·T-B·T-D 트랙: 알림 토글 / 식이 제한 / 노쇼 카운터 등 */}
      <Card>
        <p className="text-sm text-ink-muted">
          알림 · 즐겨찾기 · 히스토리 · 뱃지 등은 추후 추가 (각 트랙)
        </p>
      </Card>
    </div>
  )
}
