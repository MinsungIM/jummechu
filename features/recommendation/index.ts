// M5 recommendation — Public API stub. unit-of-work-dependency.md M5 섹션.
import type { RestaurantRatingSummary } from '@/features/rating'

const NI = (): never => {
  throw new Error('[features/recommendation] not implemented')
}

export type RecommendationCard = {
  restaurantId: number
  restaurantName: string
  primaryMenu: { id: number; name: string; price: number | null } | null
  reason: 'recent_skip' | 'high_rating' | 'random'
  lastVisitedAt: number | null
}

export async function getTodayRecommendations(_userId: number, _count: number): Promise<RecommendationCard[]> { return NI() }
export async function reshuffleRecommendations(_userId: number, _excludeIds: number[]): Promise<RecommendationCard[]> { return NI() }
export async function getSatisfactionTop(_limit: number): Promise<RestaurantRatingSummary[]> { return NI() }
