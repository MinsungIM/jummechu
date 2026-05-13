// M1 auth — Public API (이 파일만 외부에서 import 허용. eslint.config.js 강제)
// 시그니처는 unit-of-work-dependency.md M1 섹션 그대로
export { getCurrentUser } from './server/getCurrentUser'
export { requireUser, UnauthorizedError } from './server/requireUser'
export { signupUser, signupInputSchema, EmailAlreadyExistsError } from './server/signupUser'
export { changePassword, InvalidCurrentPasswordError } from './server/changePassword'

export { LoginForm } from './components/LoginForm'
export { SignupForm } from './components/SignupForm'
export { ChangePasswordForm } from './components/ChangePasswordForm'
export { LogoutButton } from './components/LogoutButton'

export type { User, SignupInput } from './types'
