'use client'
// NaverMap — 네이버 지도 JS SDK 통합. Functional Design §4.13 / §5.4
// - `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 미설정 시 placeholder + console.warn
// - SDK 로딩 실패 시 placeholder
// - 마커는 RestaurantMapMarker[] 기반, 클릭 시 onMarkerClick 또는 기본 /restaurants/{id} 이동
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RestaurantMapMarker } from '@/features/restaurant'

type LatLng = { lat: number; lng: number }

type Props = {
  markers: RestaurantMapMarker[]
  center?: LatLng
  zoom?: number
  height?: number | string
  onMarkerClick?: (restaurantId: number) => void
}

// 서울 시청 — 기본 중심
const DEFAULT_CENTER: LatLng = { lat: 37.5663, lng: 126.9779 }
const DEFAULT_ZOOM = 14

// SDK 싱글톤 로딩 상태 (모듈 스코프) — 중복 script 태그 방지
let sdkPromise: Promise<void> | null = null

type WindowWithNaver = Window & { naver?: { maps?: unknown } }

function getNaver(): { maps: NaverMapsAPI } | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as WindowWithNaver
  if (w.naver && w.naver.maps) {
    return w.naver as { maps: NaverMapsAPI }
  }
  return undefined
}

// 네이버 지도 SDK 의 최소 사용 표면 — `any` 회피용 명시적 타입
type LatLngCtor = new (lat: number, lng: number) => unknown
type NaverMapInstance = unknown
type NaverMapCtor = new (
  el: HTMLElement,
  options: { center: unknown; zoom: number }
) => NaverMapInstance
type MarkerInstance = unknown
type MarkerCtor = new (options: { position: unknown; map: NaverMapInstance; title: string }) => MarkerInstance
type EventApi = { addListener: (target: unknown, name: string, handler: () => void) => void }
type NaverMapsAPI = {
  LatLng: LatLngCtor
  Map: NaverMapCtor
  Marker: MarkerCtor
  Event: EventApi
}

function loadNaverSdk(clientId: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('window 없음'))
  if (getNaver()) return Promise.resolve()
  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-jummechu-naver-sdk="1"]'
    ) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('네이버 지도 SDK 로딩 실패')))
      return
    }
    const script = document.createElement('script')
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${encodeURIComponent(
      clientId
    )}`
    script.async = true
    script.defer = true
    script.dataset.jummechuNaverSdk = '1'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('네이버 지도 SDK 로딩 실패'))
    document.head.appendChild(script)
  })
  return sdkPromise
}

export default function NaverMap({
  markers,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = 480,
  onMarkerClick,
}: Props) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error' | 'no-key'>('idle')

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
    if (!clientId) {
      console.warn('[NaverMap] NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 가 설정되지 않아 지도 대신 placeholder 를 렌더링합니다.')
      setStatus('no-key')
      return
    }

    let cancelled = false
    setStatus('loading')
    loadNaverSdk(clientId)
      .then(() => {
        if (cancelled) return
        try {
          const naver = getNaver()
          if (!naver || !containerRef.current) {
            setStatus('error')
            return
          }
          const map = new naver.maps.Map(containerRef.current, {
            center: new naver.maps.LatLng(center.lat, center.lng),
            zoom,
          })

          for (const m of markers) {
            if (typeof m.lat !== 'number' || typeof m.lng !== 'number') continue
            const marker = new naver.maps.Marker({
              position: new naver.maps.LatLng(m.lat, m.lng),
              map,
              title: m.name,
            })
            naver.maps.Event.addListener(marker, 'click', () => {
              if (onMarkerClick) onMarkerClick(m.id)
              else router.push(`/restaurants/${m.id}`)
            })
          }
          setStatus('ready')
        } catch (e) {
          console.error('[NaverMap] 지도 초기화 실패', e)
          setStatus('error')
        }
      })
      .catch((e) => {
        console.error('[NaverMap] SDK 로딩 실패', e)
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
    // markers/center/zoom 변경 시 재렌더 (간단화 — 실제 운영 시 marker diff 최적화 별도)
  }, [markers, center.lat, center.lng, zoom, onMarkerClick, router])

  const heightStyle = typeof height === 'number' ? `${height}px` : height

  if (status === 'no-key' || status === 'error') {
    const msg =
      status === 'no-key'
        ? '지도 키가 설정되지 않았습니다 (NEXT_PUBLIC_NAVER_MAP_CLIENT_ID).'
        : '지도를 불러올 수 없습니다.'
    return (
      <div
        data-testid="naver-map-placeholder"
        className="w-full rounded-2xl bg-surface-secondary flex flex-col items-center justify-center text-ink-muted text-sm"
        style={{ height: heightStyle }}
      >
        <p>{msg}</p>
        {markers.length > 0 && (
          <p className="mt-2 text-xs">식당 {markers.length}곳 표시 대기 중</p>
        )}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      data-testid="naver-map-canvas"
      className="w-full rounded-2xl overflow-hidden bg-surface-secondary"
      style={{ height: heightStyle }}
    />
  )
}
