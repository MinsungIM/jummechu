// M4 rating — Public API (외부에서 import 허용)
// functional-design.md §0.1 채택 시그니처

// 타입
export type {
  RatingForRestaurant,
  RatingForMenu,
  RestaurantRatingStats,
  MenuRatingStats,
  RateRestaurantInput,
  RateMenuInput,
} from './types'

// Server functions
export { rateRestaurant } from './server/rateRestaurant'
export { rateMenu } from './server/rateMenu'
export { getRestaurantRatingStats } from './server/getRestaurantRatingStats'
export { getMenuRatingStats } from './server/getMenuRatingStats'
export { listMyRatings } from './server/listMyRatings'
export { canRateRestaurant } from './server/canRateRestaurant'
export { canRateMenu } from './server/canRateMenu'

// 도메인 에러
export {
  ValidationError,
  NotEligibleError,
  RestaurantNotFoundError,
  MenuNotFoundError,
} from './server/_lib/errors'

// 컴포넌트
export { RatingStars } from './components/RatingStars'
export { RatingForm, type RatingFormSubmit } from './components/RatingForm'
export { RatingItem } from './components/RatingItem'
export { RatingList, type RatingListEntry } from './components/RatingList'
