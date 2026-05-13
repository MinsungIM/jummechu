// NextAuth 인증 게이트 — (main) 라우트 보호. (auth) 라우트는 미인증 진입 허용.
// design.md §4.3
// Next 16 호환: re-export 대신 명시적 함수 export
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: { signIn: '/login' },
})

export const config = {
  matcher: [
    /*
     * 보호된 경로 매처:
     * - 메인 그룹 라우트 (홈, 지도, 설정, 파티, 식당, 히스토리)
     * - /api/auth/* 와 /api/auth/signup은 제외
     */
    '/((?!api/auth|api/.*signup|login|signup|_next/static|_next/image|favicon.ico).*)',
  ],
}
