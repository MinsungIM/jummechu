// 표준 API 응답 헬퍼
import { NextResponse } from 'next/server'

export function ok<T>(data: T, init?: number | ResponseInit) {
  const initObj = typeof init === 'number' ? { status: init } : init
  return NextResponse.json({ data }, initObj)
}

export function err(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// 미구현 라우트 stub — Route Handler에 export const GET = notImplemented 형태로 사용
export function notImplemented() {
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: '아직 구현되지 않은 엔드포인트' } },
    { status: 501 }
  )
}
