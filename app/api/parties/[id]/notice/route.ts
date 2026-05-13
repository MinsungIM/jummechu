// M2 party — PUT: 한 줄 공지 (owner only)
import { ok, err } from '@/lib/http'
import { setNotice, PartyNotFoundError, NotOwnerError, ValidationError } from '@/features/party'
import { requireUser, UnauthorizedError } from '@/features/auth'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Params) {
  const { id: idRaw } = await params
  const id = Number(idRaw)
  if (!Number.isInteger(id) || id <= 0) return err('VALIDATION_ERROR', 'invalid id', 400)
  try {
    const user = await requireUser()
    const body = (await req.json()) as { notice?: string }
    await setNotice(id, user.id, body.notice ?? '')
    return ok({ ok: true })
  } catch (e) {
    if (e instanceof UnauthorizedError) return err(e.code, e.message, 401)
    if (e instanceof PartyNotFoundError) return err(e.code, e.message, 404)
    if (e instanceof NotOwnerError) return err(e.code, e.message, 403)
    if (e instanceof ValidationError)
      return Response.json(
        { error: { code: e.code, message: e.message, fieldErrors: e.fieldErrors } },
        { status: 400 }
      )
    if (e instanceof Error) return err('INTERNAL', e.message, 500)
    return err('INTERNAL', 'Unknown error', 500)
  }
}
