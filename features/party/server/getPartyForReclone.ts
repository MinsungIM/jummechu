// getPartyForReclone — 기존 파티 정보로 새 파티 생성 폼 prefill (§3.1 재파티)
// departAt/joinUntil 은 새 시각으로 채워야 하므로 null 로 비움. 호출측에서 입력.
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { parties } from '@/drizzle/schema'
import { PartyNotFoundError } from './_lib/errors'
import type { CreatePartyInput } from '../types'

export async function getPartyForReclone(id: number): Promise<CreatePartyInput> {
  const db = getDb()
  const rows = await db.select().from(parties).where(eq(parties.id, id)).limit(1)
  const p = rows[0]
  if (!p) throw new PartyNotFoundError(id)

  return {
    name: p.name,
    restaurantId: p.restaurantId,
    restaurantNameFreetext: p.restaurantNameFreetext ?? undefined,
    departAt: 0, // 호출측에서 채움
    joinUntil: 0,
    place: p.place,
    priceBand: p.priceBand,
    capacity: p.capacity,
    rules: p.rules ?? undefined,
    isSilent: p.isSilent,
    extraSchedule: p.extraSchedule ?? undefined,
  }
}
