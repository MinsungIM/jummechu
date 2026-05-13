// 식당 row + tags 조인 헬퍼 (내부 전용)
import { eq, inArray } from 'drizzle-orm'
import type { Db } from '@/lib/db'
import { restaurants, restaurantTags, tags } from '@/drizzle/schema'
import type { Restaurant, Tag } from '../../types'

type RestaurantRowMin = {
  id: number
  name: string
  address: string | null
  category1: 'kor' | 'chn' | 'jpn' | 'wes' | null
  category2: string | null
  waitLevel: 'light' | 'medium' | 'heavy' | null
  reservationRequired: boolean
  naverPlaceId: string | null
  lat: number | null
  lng: number | null
  createdAt: number
}

function toRestaurant(row: RestaurantRowMin, tagList: Tag[]): Restaurant {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    category1: row.category1,
    category2: row.category2,
    waitLevel: row.waitLevel,
    reservationRequired: row.reservationRequired,
    naverPlaceId: row.naverPlaceId,
    lat: row.lat,
    lng: row.lng,
    tags: tagList,
    createdAt: row.createdAt,
  }
}

/**
 * 여러 식당 id 에 대한 tags 를 한 번의 JOIN 으로 가져와 Map<restaurantId, Tag[]> 반환
 */
async function loadTagsByRestaurantIds(db: Db, restaurantIds: number[]): Promise<Map<number, Tag[]>> {
  if (restaurantIds.length === 0) return new Map()
  const rows = await db
    .select({
      restaurantId: restaurantTags.restaurantId,
      id: tags.id,
      label: tags.label,
      usageCount: tags.usageCount,
    })
    .from(restaurantTags)
    .innerJoin(tags, eq(tags.id, restaurantTags.tagId))
    .where(inArray(restaurantTags.restaurantId, restaurantIds))

  const map = new Map<number, Tag[]>()
  for (const r of rows) {
    const list = map.get(r.restaurantId) ?? []
    list.push({ id: r.id, label: r.label, usageCount: r.usageCount })
    map.set(r.restaurantId, list)
  }
  return map
}

/** 식당 단일 조회 + tags. row 없으면 null. */
export async function loadRestaurantWithTags(db: Db, id: number): Promise<Restaurant | null> {
  const rows = await db.select().from(restaurants).where(eq(restaurants.id, id)).limit(1)
  const row = rows[0]
  if (!row) return null
  const tagMap = await loadTagsByRestaurantIds(db, [id])
  return toRestaurant(row, tagMap.get(id) ?? [])
}

/** 여러 식당 row 를 Restaurant[] 로 변환 (tags 동시 JOIN). */
export async function loadRestaurantsWithTags(db: Db, rows: RestaurantRowMin[]): Promise<Restaurant[]> {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)
  const tagMap = await loadTagsByRestaurantIds(db, ids)
  return rows.map((r) => toRestaurant(r, tagMap.get(r.id) ?? []))
}
