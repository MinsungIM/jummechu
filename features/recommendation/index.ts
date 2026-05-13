// M5 recommendation — Public API
// functional-design.md §0.1 채택 시그니처

export type { RecommendationItem, RecommendationReason, Satisfaction } from './types'

// Server functions
export { recommendForUser } from './server/recommendForUser'
export { getDailySatisfaction } from './server/getDailySatisfaction'
export { listPopularThisWeek } from './server/listPopularThisWeek'

// 컴포넌트
export { DashboardWidget } from './components/DashboardWidget'
export { SatisfactionGauge } from './components/SatisfactionGauge'
