// 통합 테스트용 in-memory SQLite + drizzle 마이그레이션
import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import * as schema from '@/drizzle/schema'
import { setDbForTesting, type Db } from '@/lib/db'

const MIGRATIONS_DIR = resolve(__dirname, '../../drizzle/migrations')

function applyMigrations(sqlite: Database.Database) {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  for (const f of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, f), 'utf-8')
    // Drizzle migration files use `--> statement-breakpoint` separator.
    const stmts = sql.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean)
    for (const stmt of stmts) {
      sqlite.exec(stmt)
    }
  }
}

export function createTestDb(): { db: Db; close: () => void } {
  const sqlite = new Database(':memory:')
  sqlite.pragma('foreign_keys = ON')
  applyMigrations(sqlite)
  const db = drizzle(sqlite, { schema }) as BetterSQLite3Database<typeof schema>
  setDbForTesting(db)
  return {
    db,
    close: () => {
      setDbForTesting(null)
      sqlite.close()
    },
  }
}
