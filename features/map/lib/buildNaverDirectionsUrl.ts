// buildNaverDirectionsUrl — Functional Design §4.12
// 네이버 지도 외부 길찾기/검색 딥링크 URL 생성. 순수 함수 (Node + Browser 양쪽).
export type LatLng = { lat: number; lng: number }

/**
 * 네이버 지도 외부 길찾기 URL 을 생성한다.
 *  - `from = 'current'` 인 경우 안전한 fallback 으로 단순 장소 검색 URL 사용
 *    (네이버 V5 directions URL 의 출발지 "현재 위치" 파라미터는 공식 문서화돼 있지 않아 안정성 떨어짐)
 *  - `from = {lat,lng}` 인 경우 출발지 좌표를 명시한 directions URL 사용
 * 식당명은 항상 encodeURIComponent 처리.
 */
export function buildNaverDirectionsUrl(
  from: LatLng | 'current',
  toLat: number,
  toLng: number,
  restaurantName: string
): string {
  const safeName = encodeURIComponent(restaurantName || '식당')
  const safeLat = Number(toLat)
  const safeLng = Number(toLng)
  if (!Number.isFinite(safeLat) || !Number.isFinite(safeLng)) {
    // 좌표 불명: 단순 장소 검색으로 안전 fallback
    return `https://map.naver.com/p/search/${safeName}`
  }

  if (from === 'current') {
    // 현재 위치 → 목적지: 공식 단순 deep link 가 없어 장소 검색으로 fallback
    return `https://map.naver.com/p/search/${safeName}/place?c=${safeLng.toFixed(6)},${safeLat.toFixed(6)},15,0,0,0,dh`
  }

  const fromLat = Number(from.lat)
  const fromLng = Number(from.lng)
  if (!Number.isFinite(fromLat) || !Number.isFinite(fromLng)) {
    return `https://map.naver.com/p/search/${safeName}`
  }

  // V5 directions URL — start/goal 좌표 + 이름 인코딩
  return (
    `https://map.naver.com/p/directions/` +
    `${fromLng.toFixed(6)},${fromLat.toFixed(6)},,/` +
    `${safeLng.toFixed(6)},${safeLat.toFixed(6)},${safeName}/` +
    `-/transit`
  )
}
