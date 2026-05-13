// M7 notification — GET listMy / listMyUnread (?unread=1)
import { NextRequest } from 'next/server'
import { ok, err } from '@/lib/http'
import { requireUser, UnauthorizedError } from '@/features/auth'
import { listMy, listMyUnread, type NotificationKind } from '@/features/notification'

const ALLOWED_KINDS: readonly NotificationKind[] = ['depart_soon', 'notice', 'cancelled', 'system']

function isKind(v: string | null): v is NotificationKind {
  return v !== null && (ALLOWED_KINDS as readonly string[]).includes(v)
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser()
    const url = req.nextUrl.searchParams
    const unreadOnly = url.get('unread') === '1'
    const kindParam = url.get('kind')
    const limitParam = url.get('limit')
    const limit = limitParam ? Number(limitParam) : 30

    let items = unreadOnly ? await listMyUnread(user.id) : await listMy(user.id, limit)
    if (isKind(kindParam)) {
      items = items.filter((n) => n.kind === kindParam)
    }
    return ok(items)
  } catch (e) {
    if (e instanceof UnauthorizedError) return err(e.code, e.message, 401)
    if (e instanceof Error) return err('INTERNAL', e.message, 500)
    return err('INTERNAL', 'Unknown error', 500)
  }
}
