// M3 restaurant 타입 — unit-of-work-dependency.md M3 그대로
export type Category1 = 'kor' | 'chn' | 'jpn' | 'wes'
export type WaitLevel = 'light' | 'medium' | 'heavy'

export type Tag = { id: number; label: string; usageCount: number }

export type Restaurant = {
  id: number
  name: string
  address: string | null
  category1: Category1 | null
  category2: string | null
  waitLevel: WaitLevel | null
  reservationRequired: boolean
  naverPlaceId: string | null
  lat: number | null
  lng: number | null
  tags: Tag[]
  createdAt: number
}

export type RestaurantSummary = Pick<Restaurant, 'id' | 'name' | 'category1' | 'lat' | 'lng'>
export type Menu = { id: number; restaurantId: number; name: string; price: number | null }
export type RestaurantMapMarker = Pick<
  Restaurant,
  'id' | 'name' | 'lat' | 'lng' | 'category1' | 'waitLevel' | 'reservationRequired'
> & {
  avgRating: number | null
}
