// dev 편의용 시드 — 식당 5곳 + 메뉴 + 태그
// 사용: `pnpm tsx scripts/seed-restaurants.ts`
// 멱등하지 않음 (실행할 때마다 누적). DB 초기화 후 1회만 권장.
import { createDb, setDbForTesting } from '../lib/db'
import { restaurants } from '../drizzle/schema'
import { addMenu, tagRestaurant } from '../features/restaurant'

async function seedUser(db: ReturnType<typeof createDb>): Promise<number> {
  const { users } = await import('../drizzle/schema')
  const bcrypt = (await import('bcryptjs')).default
  const passwordHash = await bcrypt.hash('seed1234', 4)
  const inserted = db
    .insert(users)
    .values({
      email: 'seed@solbox.com',
      name: 'seed-bot',
      passwordHash,
      team: 'dev',
      createdAt: Date.now(),
    })
    .returning({ id: users.id })
    .all()
  return inserted[0]!.id
}

async function main() {
  const url = process.env.DATABASE_URL ?? './data/jummechu.db'
  const db = createDb(url)
  // server 함수들이 getDb() → override 우선이라 setDbForTesting 으로 동일 DB 주입
  setDbForTesting(db)

  const userId = await seedUser(db)

  const seedData: Array<{
    name: string
    address: string
    category1: 'kor' | 'chn' | 'jpn' | 'wes'
    category2: string
    lat: number
    lng: number
    menus: Array<{ name: string; price: number | null }>
    tags: string[]
  }> = [
    {
      name: '국밥천국',
      address: '서울 강남구 테헤란로 1',
      category1: 'kor',
      category2: '국밥',
      lat: 37.5012,
      lng: 127.0396,
      menus: [
        { name: '돼지국밥', price: 9000 },
        { name: '순대국밥', price: 9500 },
      ],
      tags: ['가성비', '든든한한끼', '점심추천'],
    },
    {
      name: '하카타라멘',
      address: '서울 강남구 강남대로 123',
      category1: 'jpn',
      category2: '라멘',
      lat: 37.5021,
      lng: 127.0271,
      menus: [
        { name: '돈코츠라멘', price: 12000 },
        { name: '교자', price: 5000 },
      ],
      tags: ['혼밥가능', '진한국물'],
    },
    {
      name: '북경반점',
      address: '서울 강남구 역삼로 88',
      category1: 'chn',
      category2: '중식',
      lat: 37.5008,
      lng: 127.0354,
      menus: [
        { name: '짜장면', price: 7000 },
        { name: '짬뽕', price: 8000 },
        { name: '탕수육 (소)', price: 22000 },
      ],
      tags: ['회식하기좋음', '룸있음'],
    },
    {
      name: '파스타로마',
      address: '서울 강남구 봉은사로 222',
      category1: 'wes',
      category2: '파스타',
      lat: 37.5113,
      lng: 127.0444,
      menus: [
        { name: '까르보나라', price: 14000 },
        { name: '아라비아따', price: 13000 },
      ],
      tags: ['데이트', '매운맛주의'],
    },
    {
      name: '한솥도시락',
      address: '서울 강남구 선릉로 99',
      category1: 'kor',
      category2: '도시락',
      lat: 37.5042,
      lng: 127.0489,
      menus: [
        { name: '제육덮밥', price: 5500 },
        { name: '치킨마요', price: 5000 },
      ],
      tags: ['가성비', '혼밥가능'],
    },
  ]

  for (const r of seedData) {
    const inserted = db
      .insert(restaurants)
      .values({
        name: r.name,
        address: r.address,
        category1: r.category1,
        category2: r.category2,
        waitLevel: 'light',
        reservationRequired: false,
        lat: r.lat,
        lng: r.lng,
        naverPlaceId: null,
        createdAt: Date.now(),
      })
      .returning({ id: restaurants.id })
      .all()
    const restaurantId = inserted[0]!.id

    for (const m of r.menus) {
      await addMenu(restaurantId, m.name, m.price)
    }
    for (const t of r.tags) {
      await tagRestaurant(restaurantId, t, userId)
    }
    console.log(`✓ ${r.name} 시드 완료 (id=${restaurantId})`)
  }

  console.log('\n시드 데이터 주입 완료.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
