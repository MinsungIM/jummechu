// M3 restaurant — Public API stub. unit-of-work-dependency.md M3 섹션.
const NI = (): never => {
  throw new Error('[features/restaurant] not implemented')
}

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
export type RestaurantMapMarker = Pick<Restaurant, 'id' | 'name' | 'lat' | 'lng' | 'category1' | 'waitLevel' | 'reservationRequired'> & {
  avgRating: number | null
}

export async function getRestaurant(_id: number): Promise<Restaurant | null> { return NI() }
export async function getRestaurantSummary(_id: number): Promise<RestaurantSummary | null> { return NI() }
export async function listRestaurantsByTags(_tagIds: number[]): Promise<Restaurant[]> { return NI() }
export async function searchRestaurantsByTag(_label: string): Promise<Restaurant[]> { return NI() }
export async function addMenu(_restaurantId: number, _name: string, _price: number | null): Promise<Menu> { return NI() }
export async function getMenu(_menuId: number): Promise<Menu | null> { return NI() }
export async function getMenusByRestaurant(_restaurantId: number): Promise<Menu[]> { return NI() }
export async function suggestTags(_prefix: string): Promise<Tag[]> { return NI() }
export async function tagRestaurant(_restaurantId: number, _label: string, _byUserId: number): Promise<void> { return NI() }
export async function getPopularTags(_limit: number): Promise<Tag[]> { return NI() }
export async function getAllRestaurantsForMap(): Promise<RestaurantMapMarker[]> { return NI() }
