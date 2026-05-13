// M7 notification — Public API (eslint.config.js로 강제)
// Functional Design §3. 기존 D+0 stub 시그니처는 본 트랙에서 대체됨.
// (호출자 없음 — `unit-of-work-dependency.md` matrix상 M7은 호출 받지 않음)

export type { Notification, NotificationKind } from './types'

// Server 함수
export { listMyUnread } from './server/listMyUnread'
export { listMy } from './server/listMy'
export { markAllRead } from './server/markAllRead'
export { markRead } from './server/markRead'
export { notifyDepartSoon } from './server/notifyDepartSoon'
export { notifyNotice } from './server/notifyNotice'
export { notifyCancelled } from './server/notifyCancelled'

// 도메인 에러
export { ValidationError, NotificationNotFoundError } from './server/_lib/errors'

// 컴포넌트
export { NotificationBadge } from './components/NotificationBadge'
export { NotificationList } from './components/NotificationList'
export { NotificationItem } from './components/NotificationItem'
export { InAppBanner } from './components/InAppBanner'
