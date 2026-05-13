// 입력 검증 헬퍼 — functional-design.md §1.1 invariants
import { ValidationError } from './errors'

export function validateStars(stars: number | undefined, required: boolean): void {
  if (stars === undefined) {
    if (required) throw new ValidationError({ stars: '필수 입력' })
    return
  }
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new ValidationError({ stars: '1~5 정수만 허용' })
  }
}

export function validateComment(comment: string | undefined): void {
  if (comment === undefined || comment === null) return
  if (typeof comment !== 'string') throw new ValidationError({ comment: '문자열만 허용' })
  if (comment.length > 200) throw new ValidationError({ comment: '200자 이내' })
}

export function validateTagLabels(tagLabels: string[] | undefined): void {
  if (!tagLabels) return
  if (!Array.isArray(tagLabels)) throw new ValidationError({ tagLabels: '배열만 허용' })
  if (tagLabels.length > 10) throw new ValidationError({ tagLabels: '최대 10개' })
  for (const label of tagLabels) {
    if (typeof label !== 'string') throw new ValidationError({ tagLabels: '문자열 라벨만' })
    if (label.length < 1 || label.length > 30) {
      throw new ValidationError({ tagLabels: '라벨 길이 1~30자' })
    }
  }
}
