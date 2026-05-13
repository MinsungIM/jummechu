// M3 restaurant — Public API (eslint.config.js 로 강제).
// 시그니처는 unit-of-work-dependency.md M3 섹션 그대로.

// Public 타입
export type {
  Category1,
  WaitLevel,
  Tag,
  Restaurant,
  RestaurantSummary,
  Menu,
  RestaurantMapMarker,
} from './types'

// Read path
export { getRestaurant } from './server/getRestaurant'
export { getRestaurantSummary } from './server/getRestaurantSummary'
export { listRestaurantsByTags } from './server/listRestaurantsByTags'
export { searchRestaurantsByTag } from './server/searchRestaurantsByTag'
export { getMenu } from './server/getMenu'
export { getMenusByRestaurant } from './server/getMenusByRestaurant'
export { suggestTags } from './server/suggestTags'
export { getPopularTags } from './server/getPopularTags'
export { getAllRestaurantsForMap } from './server/getAllRestaurantsForMap'

// Write path
export { addMenu } from './server/addMenu'
export { tagRestaurant } from './server/tagRestaurant'

// 도메인 에러
export { ValidationError, RestaurantNotFoundError, MenuNotFoundError } from './server/_lib/errors'

// 내부 헬퍼 (단위 테스트 대상으로만 export)
export { normalizeTagLabel, MAX_TAG_LENGTH } from './server/_lib/normalizeTag'

// 컴포넌트
export { RestaurantCard } from './components/RestaurantCard'
export { RestaurantList } from './components/RestaurantList'
export { SearchInput } from './components/SearchInput'
export { TagChip } from './components/TagChip'
