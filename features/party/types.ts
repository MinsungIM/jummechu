// M2 party Public 타입 — unit-of-work-dependency.md M2 시그니처와 일치
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
