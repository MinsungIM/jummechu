// 테스트 fixture 팩토리
import bcrypt from 'bcryptjs'
import { users, restaurants } from '@/drizzle/schema'
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

type Category1 = 'kor' | 'chn' | 'jpn' | 'wes'
type WaitLevel = 'light' | 'medium' | 'heavy'

export async function makeRestaurant(
  db: Db,
  overrides: Partial<{
    name: string
    address: string | null
    category1: Category1 | null
    category2: string | null
    waitLevel: WaitLevel | null
    reservationRequired: boolean
    lat: number | null
    lng: number | null
    naverPlaceId: string | null
  }> = {}
): Promise<{ id: number; name: string }> {
  const inserted = db
    .insert(restaurants)
    .values({
      name: overrides.name ?? `식당${Math.random().toString(36).slice(2, 6)}`,
      address: overrides.address ?? null,
      category1: overrides.category1 ?? null,
      category2: overrides.category2 ?? null,
      waitLevel: overrides.waitLevel ?? null,
      reservationRequired: overrides.reservationRequired ?? false,
      lat: overrides.lat ?? null,
      lng: overrides.lng ?? null,
      naverPlaceId: overrides.naverPlaceId ?? null,
      createdAt: Date.now(),
    })
    .returning({ id: restaurants.id, name: restaurants.name })
    .all()
  return inserted[0]!
}
