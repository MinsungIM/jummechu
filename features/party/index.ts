// M2 party — Public API (eslint.config.js로 강제). 시그니처는 unit-of-work-dependency.md M2 그대로.

export type {
  CreatePartyInput,
  Party,
  PartyDetail,
  PartyCard,
  PartyFilter,
  HistoryItem,
  Membership,
  RestaurantVisit,
} from './types'

// sub-batch 1 (Read path) — 실제 구현
export { createParty } from './server/createParty'
export { getParty } from './server/getParty'
export { listOpenParties } from './server/listOpenParties'

// sub-batch 2 (Write path) — 실제 구현
export { joinParty } from './server/joinParty'
export { leaveParty } from './server/leaveParty'
export { getMembership } from './server/getMembership'

// sub-batch 3 (History + extras) — 실제 구현
export { setNotice } from './server/setNotice'
export { cancelParty } from './server/cancelParty'
export { listMyHistory } from './server/listMyHistory'
export { listMyOpenParties } from './server/listMyOpenParties'
export { getPartyForReclone } from './server/getPartyForReclone'
export { getUserVisitHistory } from './server/getUserVisitHistory'

// 도메인 에러
export {
  PartyNotFoundError,
  RestaurantNotFoundError,
  ValidationError,
  PartyClosedError,
  CapacityFullError,
  AlreadyMemberError,
  NotMemberError,
  NotOwnerError,
  OwnerCannotLeaveError,
  JoinUntilPassedError,
} from './server/_lib/errors'

// 컴포넌트
export { PartyCard as PartyCardView } from './components/PartyCard'
export { PartyCreateForm } from './components/PartyCreateForm'
export { PartyDetailView } from './components/PartyDetailView'
export { EmptyState } from './components/EmptyState'
export { JoinAction } from './components/JoinAction'

// PartyFilter 재export (route handler 에서 사용)
export type { PartyFilter as Filter } from './types'
