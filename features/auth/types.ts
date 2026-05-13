// M1 auth Public API 타입 (unit-of-work-dependency.md 시그니처와 일치)
export type User = {
  id: number
  email: string
  name: string
  team: string | null
  createdAt: number
}

export type SignupInput = {
  name: string
  email: string
  password: string
}
