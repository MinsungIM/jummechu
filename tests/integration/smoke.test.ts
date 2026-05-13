// in-memory SQLite 통합 테스트 하네스 작동 확인.
// 트랙들이 자기 모듈 통합 테스트를 이 패턴으로 추가.
import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@/drizzle/schema'

describe('integration smoke (in-memory SQLite + Drizzle)', () => {
  it('can create in-memory db and load schema namespace', () => {
    const sqlite = new Database(':memory:')
    const db = drizzle(sqlite, { schema })
    expect(db).toBeDefined()
    sqlite.close()
  })
})
