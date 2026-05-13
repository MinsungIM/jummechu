// M4 rating 도메인 타입 — functional-design.md §1 도메인 모델

export type RatingForRestaurant = {
  id: number
  restaurantId: number
  userId: number
  partyId: number
  stars: number | null
  tagLabels: string[]
  createdAt: number
}

export type RatingForMenu = {
  id: number
  menuId: number
  userId: number
  partyId: number
  stars: number
  comment: string | null
  createdAt: number
}

export type RestaurantRatingStats = {
  restaurantId: number
  avgStars: number
  count: number
  tagFrequency: Array<{ tagLabel: string; count: number }>
}

export type MenuRatingStats = {
  menuId: number
  avgStars: number
  count: number
}

export type RateRestaurantInput = {
  userId: number
  restaurantId: number
  partyId: number
  stars?: number
  comment?: string
  tagLabels?: string[]
}

export type RateMenuInput = {
  userId: number
  menuId: number
  partyId: number
  stars: number
  comment?: string
}
