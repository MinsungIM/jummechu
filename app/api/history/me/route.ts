// M2 party — 내 히스토리 (참여한 closed/cancelled 파티)
import { ok, err } from '@/lib/http'
import { listMyHistory } from '@/features/party'
import { requireUser, UnauthorizedError } from '@/features/auth'

export async function GET() {
  try {
    const user = await requireUser()
    const items = await listMyHistory(user.id)
    return ok(items)
  } catch (e) {
    if (e instanceof UnauthorizedError) return err(e.code, e.message, 401)
    if (e instanceof Error) return err('INTERNAL', e.message, 500)
    return err('INTERNAL', 'Unknown error', 500)
  }
}
