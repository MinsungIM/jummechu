// M2 party — GET getParty (PATCH/DELETE은 sub-batch 2/3)
import { ok, err, notImplemented } from '@/lib/http'
import { getParty } from '@/features/party'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id: idRaw } = await params
  const id = Number(idRaw)
  if (!Number.isInteger(id) || id <= 0) return err('VALIDATION_ERROR', 'invalid id', 400)

  const party = await getParty(id)
  if (!party) return err('PARTY_NOT_FOUND', `Party ${id} not found`, 404)
  return ok(party)
}

export const PATCH = notImplemented
export const DELETE = notImplemented
