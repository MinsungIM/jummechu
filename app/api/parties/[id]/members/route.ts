// M2 party — POST: 합류 (선착순). DELETE는 /members/me 에서.
import { ok, err } from '@/lib/http'
import {
  joinParty,
  PartyNotFoundError,
  PartyClosedError,
  CapacityFullError,
  AlreadyMemberError,
  JoinUntilPassedError,
} from '@/features/party'
import { requireUser, UnauthorizedError } from '@/features/auth'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { id: idRaw } = await params
  const id = Number(idRaw)
  if (!Number.isInteger(id) || id <= 0) return err('VALIDATION_ERROR', 'invalid id', 400)
  try {
    const user = await requireUser()
    await joinParty(id, user.id)
    return ok({ joined: true })
  } catch (e) {
    if (e instanceof UnauthorizedError) return err(e.code, e.message, 401)
    if (e instanceof PartyNotFoundError) return err(e.code, e.message, 404)
    if (e instanceof PartyClosedError) return err(e.code, e.message, 409)
    if (e instanceof CapacityFullError) return err(e.code, e.message, 409)
    if (e instanceof AlreadyMemberError) return err(e.code, e.message, 409)
    if (e instanceof JoinUntilPassedError) return err(e.code, e.message, 409)
    if (e instanceof Error) return err('INTERNAL', e.message, 500)
    return err('INTERNAL', 'Unknown error', 500)
  }
}
