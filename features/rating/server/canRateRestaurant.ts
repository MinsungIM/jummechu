// canRateRestaurant — 평가 권한 검사 (다녀온 파티 참여자만)
// functional-design.md §2.6
import { getUserVisitHistory } from '@/features/party'

export async function canRateRestaurant(userId: number, restaurantId: number): Promise<boolean> {
  // sinceTs = 0 → 전체 기간 (다녀온 적 있으면 권한 인정)
  const visits = await getUserVisitHistory(userId, 0)
  return visits.some((v) => v.restaurantId === restaurantId)
}
