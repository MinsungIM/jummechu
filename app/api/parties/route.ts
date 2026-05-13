// M2 party — GET listOpenParties / POST createParty
import { NextRequest } from 'next/server'
import { ok, err } from '@/lib/http'
import {
  createParty,
  listOpenParties,
  ValidationError,
  type CreatePartyInput,
  type PartyFilter,
} from '@/features/party'
import { requireUser, UnauthorizedError } from '@/features/auth'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams
  const filter: PartyFilter = {}
  const sortBy = url.get('sortBy')
  if (sortBy === 'depart' || sortBy === 'remaining' || sortBy === 'price' || sortBy === 'category') {
    filter.sortBy = sortBy
  }
  const tagIds = url.getAll('tagId').map(Number).filter((n) => Number.isInteger(n) && n > 0)
  if (tagIds.length > 0) filter.tagIds = tagIds
  const categoryIn = url.getAll('category')
  if (categoryIn.length > 0) filter.categoryIn = categoryIn

  const parties = await listOpenParties(filter)
  return ok(parties)
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = (await req.json()) as CreatePartyInput
    const party = await createParty(user.id, body)
    return ok({ id: party.id, party }, 201)
  } catch (e) {
    if (e instanceof UnauthorizedError) return err(e.code, e.message, 401)
    if (e instanceof ValidationError) {
      return Response.json(
        { error: { code: e.code, message: e.message, fieldErrors: e.fieldErrors } },
        { status: 400 }
      )
    }
    if (e instanceof Error) return err('INTERNAL', e.message, 500)
    return err('INTERNAL', 'Unknown error', 500)
  }
}
