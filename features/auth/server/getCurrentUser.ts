import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { users } from '@/drizzle/schema/users'
import { eq } from 'drizzle-orm'
import type { User } from '../types'

export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions)
  const id = (session?.user as { id?: number } | undefined)?.id
  if (!id) return null
  const rows = await getDb().select().from(users).where(eq(users.id, id)).limit(1)
  const u = rows[0]
  if (!u) return null
  return { id: u.id, email: u.email, name: u.name, team: u.team, createdAt: u.createdAt }
}
