// M2 party — Public API stub. 시그니처는 unit-of-work-dependency.md M2 섹션 그대로.
// 실제 구현은 T-C 트랙에서 채움.
const NI = (): never => {
  throw new Error('[features/party] not implemented')
}

export type CreatePartyInput = {
  name: string
  restaurantId: number | null
  restaurantNameFreetext?: string
  departAt: number
  joinUntil: number
  place: string | null
  priceBand: string | null
  capacity: number
  rules?: string
  isSilent?: boolean
  extraSchedule?: string
}

export type Party = {
  id: number
  ownerId: number
  status: 'open' | 'closed' | 'cancelled'
  createdAt: number
} & CreatePartyInput

export type PartyDetail = Party & {
  members: Array<{ id: number; name: string }>
  notice: string | null
  currentCount: number
  restaurant: { id: number; name: string } | null
}

export type PartyCard = Pick<Party, 'id' | 'name' | 'departAt' | 'capacity' | 'priceBand' | 'isSilent'> & {
  currentCount: number
  restaurantName: string | null
  tags: string[]
}

export type PartyFilter = {
  tagIds?: number[]
  sortBy?: 'depart' | 'remaining' | 'price' | 'category'
  categoryIn?: string[]
}

export type HistoryItem = Pick<Party, 'id' | 'name' | 'departAt' | 'restaurantId'> & {
  restaurantName: string | null
  memberCount: number
}

export type Membership = { partyId: number; userId: number; joinedAt: number }
export type RestaurantVisit = { restaurantId: number; lastVisitedAt: number; visitCount: number }

export async function createParty(_ownerId: number, _input: CreatePartyInput): Promise<Party> { return NI() }
export async function getParty(_id: number): Promise<PartyDetail | null> { return NI() }
export async function listOpenParties(_filter: PartyFilter): Promise<PartyCard[]> { return NI() }
export async function joinParty(_partyId: number, _userId: number): Promise<void> { return NI() }
export async function leaveParty(_partyId: number, _userId: number): Promise<void> { return NI() }
export async function setNotice(_partyId: number, _ownerId: number, _text: string): Promise<void> { return NI() }
export async function listMyHistory(_userId: number): Promise<HistoryItem[]> { return NI() }
export async function listMyOpenParties(_userId: number): Promise<PartyCard[]> { return NI() }
export async function getPartyForReclone(_id: number): Promise<CreatePartyInput> { return NI() }
export async function getMembership(_partyId: number, _userId: number): Promise<Membership | null> { return NI() }
export async function getUserVisitHistory(_userId: number, _sinceTs: number): Promise<RestaurantVisit[]> { return NI() }
