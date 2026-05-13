// createParty — Functional Design §3.1
// BEGIN IMMEDIATE 트랜잭션: INSERT parties + INSERT party_members(owner)
import { z } from 'zod'
import { getDb } from '@/lib/db'
import { parties, partyMembers } from '@/drizzle/schema'
import { ValidationError } from './_lib/errors'
import type { CreatePartyInput, Party } from '../types'

export const createPartyInputSchema = z
  .object({
    name: z.string().trim().min(1, '파티 이름을 입력해주세요').max(100, '100자 이내'),
    restaurantId: z.number().int().positive().nullable(),
    restaurantNameFreetext: z.string().trim().max(100).optional(),
    departAt: z.number().int().positive(),
    joinUntil: z.number().int().positive(),
    place: z.string().trim().max(200).nullable(),
    priceBand: z.string().trim().max(50).nullable(),
    capacity: z.number().int().min(2, '최소 2명').max(50, '최대 50명'),
    rules: z.string().trim().max(500).optional(),
    isSilent: z.boolean().optional(),
    extraSchedule: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.joinUntil < d.departAt, {
    message: '합류 마감은 출발 시각보다 빨라야 합니다',
    path: ['joinUntil'],
  })
  .refine((d) => d.restaurantId !== null || (d.restaurantNameFreetext && d.restaurantNameFreetext.length > 0), {
    message: '식당 또는 메뉴 이름을 입력해주세요',
    path: ['restaurantNameFreetext'],
  })

export async function createParty(ownerId: number, input: CreatePartyInput): Promise<Party> {
  const parsed = createPartyInputSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join('.') || '_'] = issue.message
    }
    throw new ValidationError(fieldErrors)
  }
  const data = parsed.data
  const now = Date.now()

  const db = getDb()

  // better-sqlite3 .transaction 은 동기 콜백. drizzle은 동기 transaction 지원.
  // BEGIN IMMEDIATE 로 write-lock 즉시 획득.
  type TxResult = { id: number }
  const result: TxResult = db.transaction((tx) => {
    const inserted = tx
      .insert(parties)
      .values({
        ownerId,
        name: data.name,
        restaurantId: data.restaurantId,
        restaurantNameFreetext: data.restaurantNameFreetext ?? null,
        departAt: data.departAt,
        joinUntil: data.joinUntil,
        place: data.place,
        priceBand: data.priceBand,
        capacity: data.capacity,
        rules: data.rules ?? null,
        isSilent: data.isSilent ?? false,
        extraSchedule: data.extraSchedule ?? null,
        notice: null,
        status: 'open',
        createdAt: now,
      })
      .returning({ id: parties.id })
      .all()
    const id = inserted[0]?.id
    if (typeof id !== 'number') throw new Error('Failed to insert party')

    tx.insert(partyMembers).values({ partyId: id, userId: ownerId, joinedAt: now }).run()
    return { id }
  })

  return {
    id: result.id,
    ownerId,
    status: 'open',
    createdAt: now,
    ...data,
    rules: data.rules,
    isSilent: data.isSilent ?? false,
    extraSchedule: data.extraSchedule,
  }
}
