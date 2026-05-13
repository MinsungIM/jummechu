import { NextResponse } from 'next/server'
import { signupUser, EmailAlreadyExistsError } from '@/features/auth'
import { ZodError } from 'zod'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const user = await signupUser(body)
    return NextResponse.json({ data: { id: user.id, email: user.email, name: user.name } }, { status: 201 })
  } catch (e) {
    if (e instanceof EmailAlreadyExistsError) {
      return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: e.status })
    }
    if (e instanceof ZodError) {
      const first = e.errors[0]
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: first?.message ?? '입력 오류' } },
        { status: 400 }
      )
    }
    console.error('[api/auth/signup]', e)
    return NextResponse.json({ error: { code: 'INTERNAL', message: '서버 오류' } }, { status: 500 })
  }
}
