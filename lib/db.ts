// Drizzle 단일 인스턴스 + 테스트 주입점
// - createDb(url): 새 drizzle 인스턴스 (테스트는 ':memory:' 사용)
// - setDbForTesting(db|null): 테스트 setup/teardown 에서 override
// - getDb(): production 캐싱 + test override 우선
import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'
import * as schema from '@/drizzle/schema'

export type Db = BetterSQLite3Database<typeof schema>

let _db: Db | null = null
let _override: Db | null = null

export function createDb(url: string): Db {
  if (url !== ':memory:') {
    const dir = dirname(url)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }
  const sqlite = new Database(url)
  if (url !== ':memory:') {
    sqlite.pragma('journal_mode = WAL')
  }
  sqlite.pragma('foreign_keys = ON')
  sqlite.pragma('busy_timeout = 5000')
  return drizzle(sqlite, { schema })
}

export function setDbForTesting(db: Db | null): void {
  _override = db
}

export function getDb(): Db {
  if (_override) return _override
  if (_db) return _db
  const url = process.env.DATABASE_URL ?? './data/jummechu.db'
  _db = createDb(url)
  return _db
}

export { schema }
