// 태그 정규화 단위 테스트 — Functional Design §2 규칙
import { describe, it, expect } from 'vitest'
import { normalizeTagLabel, ValidationError } from '@/features/restaurant'

describe('normalizeTagLabel', () => {
  it('앞뒤 공백을 제거한다', () => {
    expect(normalizeTagLabel('  가성비  ')).toBe('가성비')
  })

  it('선행 # 를 제거한다', () => {
    expect(normalizeTagLabel('#가성비')).toBe('가성비')
    expect(normalizeTagLabel('# 가성비 ')).toBe('가성비')
  })

  it('내부 공백을 단일 공백으로 정리한다', () => {
    expect(normalizeTagLabel('회식 하기  좋음')).toBe('회식 하기 좋음')
  })

  it('영문은 lowercase 로 통일한다', () => {
    expect(normalizeTagLabel('BEST')).toBe('best')
    expect(normalizeTagLabel('#GoodFood')).toBe('goodfood')
  })

  it('같은 의미 변형들이 모두 동일 결과로 수렴한다', () => {
    const variants = ['#가성비', ' 가성비 ', '가성비', '#  가성비  ']
    const normalized = variants.map(normalizeTagLabel)
    expect(new Set(normalized).size).toBe(1)
    expect(normalized[0]).toBe('가성비')
  })

  it('빈 입력은 ValidationError 를 던진다', () => {
    expect(() => normalizeTagLabel('')).toThrow(ValidationError)
    expect(() => normalizeTagLabel('   ')).toThrow(ValidationError)
    expect(() => normalizeTagLabel('#')).toThrow(ValidationError)
    expect(() => normalizeTagLabel('#  ')).toThrow(ValidationError)
  })

  it('50자 초과 입력은 잘라낸다', () => {
    const long = 'a'.repeat(80)
    const result = normalizeTagLabel(long)
    expect(result.length).toBe(50)
  })

  it('비문자열 입력은 ValidationError 를 던진다', () => {
    // @ts-expect-error 의도적으로 잘못된 타입 주입
    expect(() => normalizeTagLabel(123)).toThrow(ValidationError)
  })
})
