// 시간 헬퍼 — DB는 unix ms 저장, UI는 KST 표시 (design.md §6)

export function now(): number {
  return Date.now()
}

const KST_TZ = 'Asia/Seoul'

export function formatKST(unixMs: number, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...opts,
  }).format(new Date(unixMs))
}

export function formatTimeKST(unixMs: number): string {
  return formatKST(unixMs, { year: undefined, month: undefined, day: undefined, hour: '2-digit', minute: '2-digit' })
}

export function minutesBetween(a: number, b: number): number {
  return Math.round((b - a) / (1000 * 60))
}
