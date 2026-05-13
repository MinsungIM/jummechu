// M4 rating 도메인 에러 — functional-design.md §6 에러 코드 표
export class ValidationError extends Error {
  status = 400
  code = 'VALIDATION_ERROR'
  fieldErrors: Record<string, string>
  constructor(fieldErrors: Record<string, string>) {
    super('Validation failed')
    this.fieldErrors = fieldErrors
  }
}

export class NotEligibleError extends Error {
  status = 403
  code = 'NOT_ELIGIBLE'
  constructor(reason: string) {
    super(`Not eligible to rate: ${reason}`)
  }
}

export class RestaurantNotFoundError extends Error {
  status = 404
  code = 'RESTAURANT_NOT_FOUND'
  constructor(id: number) {
    super(`Restaurant ${id} not found`)
  }
}

export class MenuNotFoundError extends Error {
  status = 404
  code = 'MENU_NOT_FOUND'
  constructor(id: number) {
    super(`Menu ${id} not found`)
  }
}
