// M6 map — Public API stub. unit-of-work-dependency.md M6 섹션.
const NI = (): never => {
  throw new Error('[features/map] not implemented')
}

export type LatLng = { lat: number; lng: number }

export function buildNaverDirectionsUrl(
  _from: LatLng | 'current',
  _toLat: number,
  _toLng: number,
  _restaurantName: string
): string {
  return NI()
}

// Client component placeholder — 실제 구현 시 NaverMap.tsx, RestaurantMarker.tsx 추가
export { default as NaverMap } from './components/NaverMap'
export { default as RestaurantMarker } from './components/RestaurantMarker'
