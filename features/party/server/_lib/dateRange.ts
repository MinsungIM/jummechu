// KST 기준 "오늘" 범위 — listOpenParties 에서 사용
// SQLite는 unix ms (UTC) 저장. KST(+09:00) 자정을 UTC ms로 환산.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

export function startOfTodayKST(nowMs: number = Date.now()): number {
  // KST 자정 = 해당 KST 날짜의 00:00 (UTC 15:00 전날)
  const kstNow = nowMs + KST_OFFSET_MS
  const kstDayStart = Math.floor(kstNow / 86_400_000) * 86_400_000
  return kstDayStart - KST_OFFSET_MS
}

export function endOfTodayKST(nowMs: number = Date.now()): number {
  return startOfTodayKST(nowMs) + 86_400_000
}
