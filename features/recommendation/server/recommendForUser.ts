// recommendForUser — 최근성 + 랜덤 (high_rated 70 / unvisited 30 / random fallback)
// functional-design.md §1.2 / §2.7
import { sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { restaurants, restaurantRatings } from '@/drizzle/schema'
import { getUserVisitHistory } from '@/features/party'
import type { RecommendationItem } from '../types'
import {
  RECENT_VISIT_WINDOW_DAYS,
  HIGH_RATED_THRESHOLD,
  HIGH_RATED_POOL_WEIGHT,
} from './_lib/constants'

type Pool = 'high_rated' | 'unvisited' | 'random'

type RestaurantRow = {
  id: number
  name: string
  avgStars: number | null
  count: number
}

function shuffle<T>(arr: T[]): T[] {
  const copy = arr.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

function pickFromPools(
  high: RestaurantRow[],
  unvisited: RestaurantRow[],
  randomPool: RestaurantRow[],
  limit: number
): Array<{ row: RestaurantRow; pool: Pool }> {
  const picked: Array<{ row: RestaurantRow; pool: Pool }> = []
  const usedIds = new Set<number>()

  const shuffledHigh = shuffle(high)
  const shuffledUnvisited = shuffle(unvisited)
  const shuffledRandom = shuffle(randomPool)

  // 가중치 따라 high·unvisited 우선 추출
  let hi = 0
  let ui = 0
  while (picked.length < limit && (hi < shuffledHigh.length || ui < shuffledUnvisited.length)) {
    const preferHigh = Math.random() < HIGH_RATED_POOL_WEIGHT
    if (preferHigh && hi < shuffledHigh.length) {
      const row = shuffledHigh[hi]!
      hi += 1
      if (!usedIds.has(row.id)) {
        picked.push({ row, pool: 'high_rated' })
        usedIds.add(row.id)
      }
    } else if (ui < shuffledUnvisited.length) {
      const row = shuffledUnvisited[ui]!
      ui += 1
      if (!usedIds.has(row.id)) {
        picked.push({ row, pool: 'unvisited' })
        usedIds.add(row.id)
      }
    } else if (hi < shuffledHigh.length) {
      const row = shuffledHigh[hi]!
      hi += 1
      if (!usedIds.has(row.id)) {
        picked.push({ row, pool: 'high_rated' })
        usedIds.add(row.id)
      }
    }
  }

  // 그래도 부족하면 random fallback
  for (const row of shuffledRandom) {
    if (picked.length >= limit) break
    if (usedIds.has(row.id)) continue
    picked.push({ row, pool: 'random' })
    usedIds.add(row.id)
  }

  return picked
}

export async function recommendForUser(userId: number, limit = 5): Promise<RecommendationItem[]> {
  const db = getDb()

  // 1. 모든 식당 + 별점 집계 (LEFT JOIN)
  const rows = (await db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      avgStars: sql<number | null>`AVG(${restaurantRatings.stars})`.as('avgStars'),
      count: sql<number>`COUNT(${restaurantRatings.id})`.as('count'),
    })
    .from(restaurants)
    .leftJoin(restaurantRatings, sql`${restaurantRatings.restaurantId} = ${restaurants.id}`)
    .groupBy(restaurants.id)) as RestaurantRow[]

  if (rows.length === 0) return [] // graceful: M3 미완성

  // 2. 최근 N일 방문 식당 set
  const sinceTs = Date.now() - RECENT_VISIT_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const visits = await getUserVisitHistory(userId, sinceTs)
  const recentRestaurantIds = new Set(visits.map((v) => v.restaurantId))

  // 3. 풀 분류
  const candidates = rows.filter((r) => !recentRestaurantIds.has(r.id))
  const highRated = candidates.filter((r) => {
    const avg = r.avgStars === null || r.avgStars === undefined ? 0 : Number(r.avgStars)
    return Number(r.count) >= 1 && avg >= HIGH_RATED_THRESHOLD
  })
  const unvisited = candidates.filter((r) => Number(r.count) === 0)
  // random pool = high도 unvisited도 아닌 후보 (중간 평점)
  const randomPool = candidates.filter(
    (r) => !highRated.includes(r) && !unvisited.includes(r)
  )

  if (highRated.length === 0 && unvisited.length === 0 && randomPool.length === 0) return []

  const picked = pickFromPools(highRated, unvisited, randomPool, limit)

  return picked.map(({ row, pool }) => ({
    restaurantId: row.id,
    restaurantName: row.name,
    reason: pool,
    score: row.avgStars === null || row.avgStars === undefined ? 0 : Number(row.avgStars),
  }))
}
