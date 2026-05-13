'use client'
import { useState, type FormEvent } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function ChangePasswordForm() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setOk(false)
    const res = await fetch('/api/auth/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
      setError(body.error?.message ?? '패스워드 변경에 실패했습니다.')
      setLoading(false)
      return
    }
    setOk(true)
    setOldPassword('')
    setNewPassword('')
    setLoading(false)
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 w-full">
      <Input
        name="oldPassword"
        type="password"
        label="현재 패스워드"
        autoComplete="current-password"
        required
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
      />
      <Input
        name="newPassword"
        type="password"
        label="새 패스워드 (8자 이상, 영문·숫자 포함)"
        autoComplete="new-password"
        required
        minLength={8}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      {error && <p className="text-sm text-category-han">{error}</p>}
      {ok && <p className="text-sm text-category-il">변경 완료</p>}
      <Button type="submit" variant="dark" size="md" pill disabled={loading} className="mt-1">
        패스워드 변경
      </Button>
    </form>
  )
}
