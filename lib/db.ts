// Drizzle 단일 인스턴스 — 모든 모듈이 import
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@/drizzle/schema'

const databasePath = process.env.DATABASE_URL ?? './data/jummechu.db'

// SQLite는 동시 쓰기에 약하므로 WAL 모드 + busy_timeout 권장
const sqlite = new Database(databasePath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')
sqlite.pragma('busy_timeout = 5000')

export const db = drizzle(sqlite, { schema })
export { schema }
