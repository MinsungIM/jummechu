// M5 recommendation — T-D 트랙
// GET: 오늘의 추천 + 만족도 통합 응답
import { recommendForUser, getDailySatisfaction } from '@/features/recommendation'
import { requireUser, UnauthorizedError } from '@/features/auth'
import { ok, err } from '@/lib/http'

const DEFAULT_LIMIT = 5

export async function GET(req: Request) {
  try {
    const user = await requireUser()
    const url = new URL(req.url)
    const limitRaw = url.searchParams.get('limit')
    const limit = limitRaw && Number.isFinite(Number(limitRaw)) ? Math.max(1, Math.min(20, Number(limitRaw))) : DEFAULT_LIMIT

    const [items, satisfaction] = await Promise.all([
      recommendForUser(user.id, limit),
      getDailySatisfaction(user.id),
    ])
    return ok({ items, satisfaction })
  } catch (e) {
    if (e instanceof UnauthorizedError) return err(e.code, e.message, e.status)
    console.error('[api/recommendations]', e)
    return err('INTERNAL', '서버 오류', 500)
  }
}
