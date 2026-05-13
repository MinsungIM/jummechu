// Vitest 하네스 작동 확인 smoke. 각 트랙은 같은 패턴으로 단위 테스트 추가.
import { describe, it, expect } from 'vitest'
import { formatTimeKST } from '@/lib/time'

describe('smoke', () => {
  it('vitest is wired up', () => {
    expect(true).toBe(true)
  })

  it('lib/time formatTimeKST returns a non-empty string', () => {
    const s = formatTimeKST(Date.now())
    expect(typeof s).toBe('string')
    expect(s.length).toBeGreaterThan(0)
  })
})
