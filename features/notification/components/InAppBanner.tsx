'use client'
// InAppBanner — B4 출발 임박 인앱 배너 (Client)
// - mount 시 unread depart_soon 최신 1건 fetch → 표시
// - dismiss 버튼: markRead 호출 후 hide
// - 60초마다 폴링 (MVP 단순 정책)
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import type { Notification } from '../types'

const POLL_MS = 60 * 1000

type ApiResp = { data?: Notification[]; error?: unknown }

async function fetchLatestDepartSoon(signal: AbortSignal): Promise<Notification | null> {
  try {
    const res = await fetch('/api/notifications?unread=1&kind=depart_soon', {
      signal,
      cache: 'no-store',
    })
    if (!res.ok) return null
    const json = (await res.json()) as ApiResp
    const list = json.data ?? []
    return list[0] ?? null
  } catch {
    return null
  }
}

export function InAppBanner() {
  const [current, setCurrent] = useState<Notification | null>(null)
  const [dismissedId, setDismissedId] = useState<number | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    let stopped = false

    const tick = async () => {
      const n = await fetchLatestDepartSoon(ctrl.signal)
      if (!stopped) setCurrent(n)
    }

    void tick()
    const interval = setInterval(() => {
      void tick()
    }, POLL_MS)

    return () => {
      stopped = true
      ctrl.abort()
      clearInterval(interval)
    }
  }, [])

  if (!current || current.id === dismissedId) return null

  const onDismiss = async () => {
    setDismissedId(current.id)
    try {
      await fetch(`/api/notifications/${current.id}/read`, { method: 'POST' })
    } catch {
      /* swallow */
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto w-full max-w-[480px] px-4 pb-2 pt-2"
    >
      <div className="rounded-2xl bg-surface-inverse text-ink-inverse shadow-tab px-4 py-3 flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary text-accent-onPrimary text-base">
          🔔
        </span>
        <div className="flex-1 min-w-0">
          <Link
            href={current.url ?? '/notifications'}
            className="block text-sm font-semibold truncate"
          >
            {current.title}
          </Link>
          {current.body && (
            <p className="text-xs text-ink-muted truncate">{current.body}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="닫기"
          className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition"
        >
          <X size={16} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  )
}
