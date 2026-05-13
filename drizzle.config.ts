import type { Config } from 'drizzle-kit'

export default {
  schema: './drizzle/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? './data/jummechu.db',
  },
  verbose: true,
  strict: true,
} satisfies Config
