// 추천 알고리즘 상수 — functional-design.md §1.2

export const RECENT_VISIT_WINDOW_DAYS = 7
export const HIGH_RATED_THRESHOLD = 4 // avgStars >= 4
export const HIGH_RATED_POOL_WEIGHT = 0.7
export const UNVISITED_POOL_WEIGHT = 0.3
export const POPULAR_MIN_COUNT = 2 // listPopularThisWeek 노출 최소 평가 수
