// M7 notification 도메인 에러 — Functional Design §8
export class ValidationError extends Error {
  status = 400
  code = 'VALIDATION_ERROR'
  fieldErrors: Record<string, string>
  constructor(fieldErrors: Record<string, string>) {
    super('Validation failed')
    this.fieldErrors = fieldErrors
  }
}

export class NotificationNotFoundError extends Error {
  status = 404
  code = 'NOTIFICATION_NOT_FOUND'
  constructor(id: number) {
    super(`Notification ${id} not found`)
  }
}
