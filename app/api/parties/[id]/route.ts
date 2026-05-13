// M2 party — GET getParty / DELETE cancelParty (owner)
// PATCH (파티 수정)은 MVP 이후
import { ok, err, notImplemented } from '@/lib/http'
import {
  getParty,
  cancelParty,
  PartyNotFoundError,
  NotOwnerError,
  PartyClosedError,
} from '@/features/party'
import { requireUser, UnauthorizedError } from '@/features/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id: idRaw } = await params
  const id = Number(idRaw)
  if (!Number.isInteger(id) || id <= 0) return err('VALIDATION_ERROR', 'invalid id', 400)

  const party = await getParty(id)
  if (!party) return err('PARTY_NOT_FOUND', `Party ${id} not found`, 404)
  return ok(party)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id: idRaw } = await params
  const id = Number(idRaw)
  if (!Number.isInteger(id) || id <= 0) return err('VALIDATION_ERROR', 'invalid id', 400)
  try {
    const user = await requireUser()
    await cancelParty(id, user.id)
    return ok({ cancelled: true })
  } catch (e) {
    if (e instanceof UnauthorizedError) return err(e.code, e.message, 401)
    if (e instanceof PartyNotFoundError) return err(e.code, e.message, 404)
    if (e instanceof NotOwnerError) return err(e.code, e.message, 403)
    if (e instanceof PartyClosedError) return err(e.code, e.message, 409)
    if (e instanceof Error) return err('INTERNAL', e.message, 500)
    return err('INTERNAL', 'Unknown error', 500)
  }
}

export const PATCH = notImplemented
