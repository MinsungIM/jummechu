// getRestaurant — Functional Design §4.1
import { getDb } from '@/lib/db'
import { loadRestaurantWithTags } from './_lib/loadRestaurantWithTags'
import type { Restaurant } from '../types'

export async function getRestaurant(id: number): Promise<Restaurant | null> {
  return loadRestaurantWithTags(getDb(), id)
}
