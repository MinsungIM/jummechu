import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/drizzle/schema/users'
import { eq } from 'drizzle-orm'
import { signupInputSchema } from './signupUser'

export class InvalidCurrentPasswordError extends Error {
  status = 400
  code = 'INVALID_CURRENT_PASSWORD'
  constructor() {
    super('현재 패스워드가 일치하지 않습니다')
  }
}

export async function changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
  signupInputSchema.shape.password.parse(newPassword)

  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  const user = rows[0]
  if (!user) throw new Error('user not found')

  const ok = await bcrypt.compare(oldPassword, user.passwordHash)
  if (!ok) throw new InvalidCurrentPasswordError()

  const newHash = await bcrypt.hash(newPassword, 10)
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId))
}
