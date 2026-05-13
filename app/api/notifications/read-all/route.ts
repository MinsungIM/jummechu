// M7 notification — POST markAllRead (본인 알림 전체)
import { ok, err } from '@/lib/http'
import { requireUser, UnauthorizedError } from '@/features/auth'
import { markAllRead } from '@/features/notification'

export async function POST() {
  try {
    const user = await requireUser()
    await markAllRead(user.id)
    return ok({ ok: true })
  } catch (e) {
    if (e instanceof UnauthorizedError) return err(e.code, e.message, 401)
    if (e instanceof Error) return err('INTERNAL', e.message, 500)
    return err('INTERNAL', 'Unknown error', 500)
  }
}
