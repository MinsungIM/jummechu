'use client'
import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get('callbackUrl') ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    })
    if (res?.error) {
      setError('이메일 또는 패스워드가 일치하지 않습니다.')
      setLoading(false)
      return
    }
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full">
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
        label="패스워드"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-category-han">{error}</p>}
      <Button type="submit" variant="dark" size="lg" pill disabled={loading} className="mt-2 w-full">
        {loading ? '로그인 중...' : '로그인'}
      </Button>
      <p className="text-center text-sm text-ink-secondary mt-2">
        아직 가입 전인가요?{' '}
        <Link href="/signup" className="font-semibold text-ink underline underline-offset-2">
          회원가입
        </Link>
      </p>
    </form>
  )
}
