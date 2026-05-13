// createParty 입력 검증 단위 테스트 (DB 없이 schema만)
import { describe, it, expect } from 'vitest'
import { createPartyInputSchema } from '@/features/party/server/createParty'

const base = {
  name: '점심 파티',
  restaurantId: null,
  restaurantNameFreetext: '김밥천국',
  departAt: Date.now() + 60 * 60 * 1000,
  joinUntil: Date.now() + 30 * 60 * 1000,
  place: null,
  priceBand: null,
  capacity: 4,
} as const

describe('createPartyInputSchema', () => {
  it('정상 입력은 통과', () => {
    const r = createPartyInputSchema.safeParse(base)
    expect(r.success).toBe(true)
  })

  it('capacity < 2 → 거절', () => {
    const r = createPartyInputSchema.safeParse({ ...base, capacity: 1 })
    expect(r.success).toBe(false)
  })

  it('capacity > 50 → 거절', () => {
    const r = createPartyInputSchema.safeParse({ ...base, capacity: 100 })
    expect(r.success).toBe(false)
  })

  it('이름 빈 문자열 거절', () => {
    const r = createPartyInputSchema.safeParse({ ...base, name: '' })
    expect(r.success).toBe(false)
  })

  it('이름 100자 초과 거절', () => {
    const r = createPartyInputSchema.safeParse({ ...base, name: 'a'.repeat(101) })
    expect(r.success).toBe(false)
  })

  it('joinUntil >= departAt 거절', () => {
    const t = Date.now() + 60 * 60 * 1000
    const r = createPartyInputSchema.safeParse({ ...base, departAt: t, joinUntil: t })
    expect(r.success).toBe(false)
  })

  it('restaurantId 와 freetext 모두 없으면 거절', () => {
    const r = createPartyInputSchema.safeParse({
      ...base,
      restaurantId: null,
      restaurantNameFreetext: undefined,
    })
    expect(r.success).toBe(false)
  })
})
