// 태그 라벨 정규화 단일 출처 — Functional Design §2
// 입력 boundary (tagRestaurant, suggestTags, searchRestaurantsByTag) 에서 모두 사용
import { ValidationError } from './errors'

const MAX_TAG_LENGTH = 50

/**
 * 사용자 입력 태그 라벨을 표준 형태로 정규화한다.
 * 규칙:
 *   1) trim
 *   2) 선행 '#' 1개 제거 (#가성비 → 가성비)
 *   3) 내부 공백을 단일 공백으로 정리 (\s+ → ' ')
 *   4) lowercase (한글은 영향 없음, 영문만 통일)
 *   5) 길이 검사: 비어있으면 ValidationError, 50자 초과면 truncate
 *
 * 의도된 충돌 사례:
 *   - "#가성비"  ↔ " 가성비 "  ↔ "가성비"  → 모두 "가성비"
 *   - "#Best"   ↔ "best"      → 모두 "best"
 */
export function normalizeTagLabel(raw: string): string {
  if (typeof raw !== 'string') {
    throw new ValidationError({ tag: '태그는 문자열이어야 합니다' })
  }
  let s = raw.trim()
  if (s.startsWith('#')) s = s.slice(1).trim()
  s = s.replace(/\s+/g, ' ').toLowerCase()
  if (s.length === 0) {
    throw new ValidationError({ tag: '태그를 입력해주세요' })
  }
  if (s.length > MAX_TAG_LENGTH) {
    s = s.slice(0, MAX_TAG_LENGTH)
  }
  return s
}

export { MAX_TAG_LENGTH }
