import { NextResponse } from 'next/server'
import {
  requireUser,
  UnauthorizedError,
  changePassword,
  InvalidCurrentPasswordError,
} from '@/features/auth'
import { ZodError } from 'zod'

export async function PATCH(request: Request) {
  try {
    const user = await requireUser()
    const body = (await request.json().catch(() => ({}))) as {
      oldPassword?: string
      newPassword?: string
    }
    if (!body.oldPassword || !body.newPassword) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'oldPassword/newPassword 필수' } },
        { status: 400 }
      )
    }
    await changePassword(user.id, body.oldPassword, body.newPassword)
    return NextResponse.json({ data: { ok: true } })
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: e.status })
    }
    if (e instanceof InvalidCurrentPasswordError) {
      return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: e.status })
    }
    if (e instanceof ZodError) {
      const first = e.errors[0]
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: first?.message ?? '입력 오류' } },
        { status: 400 }
      )
    }
    console.error('[api/auth/password]', e)
    return NextResponse.json({ error: { code: 'INTERNAL', message: '서버 오류' } }, { status: 500 })
  }
}
