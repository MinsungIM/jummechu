// M2 party — DELETE: 본인 탈퇴
import { ok, err } from '@/lib/http'
import {
  leaveParty,
  PartyNotFoundError,
  PartyClosedError,
  NotMemberError,
  OwnerCannotLeaveError,
} from '@/features/party'
import { requireUser, UnauthorizedError } from '@/features/auth'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { id: idRaw } = await params
  const id = Number(idRaw)
  if (!Number.isInteger(id) || id <= 0) return err('VALIDATION_ERROR', 'invalid id', 400)
  try {
    const user = await requireUser()
    await leaveParty(id, user.id)
    return ok({ left: true })
  } catch (e) {
    if (e instanceof UnauthorizedError) return err(e.code, e.message, 401)
    if (e instanceof PartyNotFoundError) return err(e.code, e.message, 404)
    if (e instanceof PartyClosedError) return err(e.code, e.message, 409)
    if (e instanceof NotMemberError) return err(e.code, e.message, 403)
    if (e instanceof OwnerCannotLeaveError) return err(e.code, e.message, 409)
    if (e instanceof Error) return err('INTERNAL', e.message, 500)
    return err('INTERNAL', 'Unknown error', 500)
  }
}
