// M2 party 도메인 에러 — Functional Design §7 에러 코드 표
export class PartyNotFoundError extends Error {
  status = 404
  code = 'PARTY_NOT_FOUND'
  constructor(id: number) {
    super(`Party ${id} not found`)
  }
}

export class RestaurantNotFoundError extends Error {
  status = 404
  code = 'RESTAURANT_NOT_FOUND'
  constructor(id: number) {
    super(`Restaurant ${id} not found`)
  }
}

export class ValidationError extends Error {
  status = 400
  code = 'VALIDATION_ERROR'
  fieldErrors: Record<string, string>
  constructor(fieldErrors: Record<string, string>) {
    super('Validation failed')
    this.fieldErrors = fieldErrors
  }
}

export class PartyClosedError extends Error {
  status = 409
  code = 'PARTY_CLOSED'
  constructor(id: number) {
    super(`Party ${id} already closed/cancelled`)
  }
}

export class CapacityFullError extends Error {
  status = 409
  code = 'CAPACITY_FULL'
  constructor(id: number) {
    super(`Party ${id} is full`)
  }
}

export class AlreadyMemberError extends Error {
  status = 409
  code = 'ALREADY_MEMBER'
  constructor() {
    super('Already a member')
  }
}

export class NotMemberError extends Error {
  status = 403
  code = 'NOT_MEMBER'
  constructor() {
    super('Not a member')
  }
}

export class NotOwnerError extends Error {
  status = 403
  code = 'NOT_OWNER'
  constructor() {
    super('Only owner can perform this action')
  }
}

export class OwnerCannotLeaveError extends Error {
  status = 409
  code = 'OWNER_CANNOT_LEAVE'
  constructor() {
    super('Owner cannot leave; cancel the party instead')
  }
}

export class JoinUntilPassedError extends Error {
  status = 409
  code = 'JOIN_UNTIL_PASSED'
  constructor() {
    super('Join deadline passed')
  }
}
