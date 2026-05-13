// NextAuth 단일 설정 진입점 — features/auth/server 의 helpers를 사용
// design.md §4 결정 반영: Credentials Provider + JWT 세션 30일 슬라이딩
import type { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getDb } from '@/lib/db'
import { users } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

const THIRTY_DAYS = 60 * 60 * 24 * 30

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const rows = await getDb().select().from(users).where(eq(users.email, credentials.email)).limit(1)
        const user = rows[0]
        if (!user) return null
        const ok = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!ok) return null
        return { id: String(user.id), email: user.email, name: user.name }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: THIRTY_DAYS,
    updateAge: 60 * 60 * 24, // 하루마다 슬라이딩 갱신
  },
  jwt: {
    maxAge: THIRTY_DAYS,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = Number(user.id)
      }
      return token
    },
    async session({ session, token }) {
      if (token?.userId && session.user) {
        ;(session.user as { id?: number }).id = token.userId as number
      }
      return session
    },
  },
}
