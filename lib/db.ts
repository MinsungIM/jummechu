// Drizzle 단일 인스턴스 — lazy initialization (Next 빌드 시 evaluate 회피)
import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'
import * as schema from '@/drizzle/schema'

let _db: BetterSQLite3Database<typeof schema> | null = null

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (_db) return _db
  const url = process.env.DATABASE_URL ?? './data/jummechu.db'
  const dir = dirname(url)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const sqlite = new Database(url)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  sqlite.pragma('busy_timeout = 5000')
  _db = drizzle(sqlite, { schema })
  return _db
}

export { schema }
