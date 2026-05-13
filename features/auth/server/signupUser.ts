import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { getDb } from '@/lib/db'
import { users } from '@/drizzle/schema/users'
import { eq } from 'drizzle-orm'
import { now } from '@/lib/time'
import type { User, SignupInput } from '../types'

// lunch.md §0.1 확정: 최소 8자 + 영문·숫자 조합
export const signupInputSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요').max(32),
  email: z.string().email('이메일 형식이 아닙니다').max(255),
  password: z
    .string()
    .min(8, '패스워드는 최소 8자')
    .regex(/[a-zA-Z]/, '영문 포함 필요')
    .regex(/\d/, '숫자 포함 필요'),
})

export class EmailAlreadyExistsError extends Error {
  status = 409
  code = 'EMAIL_EXISTS'
  constructor() {
    super('이미 가입된 이메일입니다')
  }
}

export async function signupUser(input: SignupInput): Promise<User> {
  const parsed = signupInputSchema.parse(input)

  const db = getDb()
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.email)).limit(1)
  if (existing[0]) throw new EmailAlreadyExistsError()

  const hash = await bcrypt.hash(parsed.password, 10)
  const ts = now()
  const inserted = await db
    .insert(users)
    .values({
      email: parsed.email,
      name: parsed.name,
      passwordHash: hash,
      createdAt: ts,
    })
    .returning()

  const u = inserted[0]
  return { id: u.id, email: u.email, name: u.name, team: u.team, createdAt: u.createdAt }
}
