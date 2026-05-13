// M7 notification — POST markRead (본인 알림 1건)
// I-3 권한 검증은 server 함수 SQL의 WHERE user_id=? 에서 강제됨.
import { ok, err } from '@/lib/http'
import { requireUser, UnauthorizedError } from '@/features/auth'
import { markRead } from '@/features/notification'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { id: idRaw } = await params
  const id = Number(idRaw)
  if (!Number.isInteger(id) || id <= 0) return err('VALIDATION_ERROR', 'invalid id', 400)
  try {
    const user = await requireUser()
    await markRead(user.id, id)
    return ok({ ok: true })
  } catch (e) {
    if (e instanceof UnauthorizedError) return err(e.code, e.message, 401)
    if (e instanceof Error) return err('INTERNAL', e.message, 500)
    return err('INTERNAL', 'Unknown error', 500)
  }
}
