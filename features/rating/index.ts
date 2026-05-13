// M4 rating — Public API stub. unit-of-work-dependency.md M4 섹션.
const NI = (): never => {
  throw new Error('[features/rating] not implemented')
}

export type RestaurantRatingInput = {
  restaurantId: number
  partyId: number
  raterId: number
  stars?: number
  tags?: string[]
}

export type MenuRatingInput = {
  menuId: number
  partyId: number
  raterId: number
  stars: number
  comment?: string
}

export type TagFreq = { label: string; count: number }
export type RestaurantRatingSummary = {
  restaurantId: number
  restaurantName: string
  avgStars: number
  ratingCount: number
}

export async function rateRestaurant(_input: RestaurantRatingInput): Promise<void> { return NI() }
export async function rateMenu(_input: MenuRatingInput): Promise<void> { return NI() }
export async function getAvgRating(_restaurantId: number): Promise<number | null> { return NI() }
export async function getMenuAvgRating(_menuId: number): Promise<number | null> { return NI() }
export async function getRestaurantTagFrequency(_restaurantId: number): Promise<TagFreq[]> { return NI() }
export async function getTopRatedRestaurants(_limit: number, _windowDays?: number): Promise<RestaurantRatingSummary[]> { return NI() }
export async function canRate(_userId: number, _restaurantId: number): Promise<boolean> { return NI() }
