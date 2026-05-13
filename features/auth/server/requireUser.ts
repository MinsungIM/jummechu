import { getCurrentUser } from './getCurrentUser'
import type { User } from '../types'

export class UnauthorizedError extends Error {
  status = 401
  code = 'UNAUTHORIZED'
  constructor() {
    super('Unauthorized')
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) throw new UnauthorizedError()
  return user
}
