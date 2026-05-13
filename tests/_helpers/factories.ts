// 테스트 fixture 팩토리
import bcrypt from 'bcryptjs'
import { users } from '@/drizzle/schema'
import type { Db } from '@/lib/db'

export async function makeUser(
  db: Db,
  overrides: Partial<{ email: string; name: string; team: string | null; password: string }> = {}
): Promise<{ id: number; email: string; name: string }> {
  const email = overrides.email ?? `u${Math.random().toString(36).slice(2, 8)}@solbox.com`
  const name = overrides.name ?? '테스트유저'
  const password = overrides.password ?? 'pass1234'
  const passwordHash = await bcrypt.hash(password, 4)
  const inserted = db
    .insert(users)
    .values({
      email,
      name,
      passwordHash,
      team: overrides.team ?? null,
      createdAt: Date.now(),
    })
    .returning({ id: users.id, email: users.email, name: users.name })
    .all()
  return inserted[0]!
}

export function inMinutes(min: number): number {
  return Date.now() + min * 60 * 1000
}
