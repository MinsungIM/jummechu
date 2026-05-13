// M2 party — Public API (eslint.config.js로 강제). 시그니처는 unit-of-work-dependency.md M2 그대로.
// 실제 구현은 sub-batch 별 점진 교체. 미구현 함수는 NI() throw.

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

import type {
  CreatePartyInput,
  HistoryItem,
  Membership,
  PartyCard,
  PartyFilter,
  RestaurantVisit,
} from './types'

// sub-batch 1 (Read path) — 실제 구현
export { createParty } from './server/createParty'
export { getParty } from './server/getParty'
export { listOpenParties } from './server/listOpenParties'

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

// sub-batch 2/3 stub
const NI = (): never => {
  throw new Error('[features/party] not implemented in sub-batch 1')
}
export async function joinParty(_partyId: number, _userId: number): Promise<void> { return NI() }
export async function leaveParty(_partyId: number, _userId: number): Promise<void> { return NI() }
export async function setNotice(_partyId: number, _ownerId: number, _text: string): Promise<void> { return NI() }
export async function cancelParty(_partyId: number, _ownerId: number): Promise<void> { return NI() }
export async function listMyHistory(_userId: number): Promise<HistoryItem[]> { return NI() }
export async function listMyOpenParties(_userId: number): Promise<PartyCard[]> { return NI() }
export async function getPartyForReclone(_id: number): Promise<CreatePartyInput> { return NI() }
export async function getMembership(_partyId: number, _userId: number): Promise<Membership | null> { return NI() }
export async function getUserVisitHistory(_userId: number, _sinceTs: number): Promise<RestaurantVisit[]> { return NI() }

// PartyFilter 재export (route handler 에서 사용)
export type { PartyFilter as Filter }
