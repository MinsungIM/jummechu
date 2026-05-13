// Drizzle 마이그레이션 실행 — tsx scripts/migrate.ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

const url = process.env.DATABASE_URL ?? './data/jummechu.db'
const dir = dirname(url)
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

const sqlite = new Database(url)
sqlite.pragma('foreign_keys = ON')
const db = drizzle(sqlite)

migrate(db, { migrationsFolder: './drizzle/migrations' })

console.log(`✅ Migrated: ${url}`)
sqlite.close()
