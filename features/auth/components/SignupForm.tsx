'use client'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function SignupForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
      setError(body.error?.message ?? '회원가입에 실패했습니다.')
      setLoading(false)
      return
    }
    // 가입 즉시 자동 로그인 (lunch.md §0.1 결정: 이메일 인증 X)
    await signIn('credentials', { email, password, redirect: false })
    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
      <Input
        name="name"
        label="이름"
        autoComplete="name"
        required
        maxLength={32}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="박민성"
      />
      <Input
        name="email"
        type="email"
        label="이메일"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="name@company.com"
      />
      <Input
        name="password"
        type="password"
        label="패스워드 (8자 이상, 영문·숫자 포함)"
        autoComplete="new-password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-category-han">{error}</p>}
      <Button type="submit" variant="dark" size="lg" pill disabled={loading} className="mt-2 w-full">
        {loading ? '가입 중...' : '가입하고 시작'}
      </Button>
      <p className="text-center text-sm text-ink-secondary mt-2">
        이미 계정이 있나요?{' '}
        <Link href="/login" className="font-semibold text-ink underline underline-offset-2">
          로그인
        </Link>
      </p>
    </form>
  )
}
