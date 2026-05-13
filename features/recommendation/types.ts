// M5 recommendation 도메인 타입 — functional-design.md §1

export type RecommendationReason = 'recent_avoid' | 'high_rated' | 'random' | 'unvisited'

export type RecommendationItem = {
  restaurantId: number
  restaurantName: string
  reason: RecommendationReason
  score: number
}

export type Satisfaction = {
  avgStars: number
  count: number
}
