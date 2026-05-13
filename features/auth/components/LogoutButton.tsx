'use client'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/Button'

export function LogoutButton() {
  return (
    <Button
      variant="secondary"
      size="md"
      pill
      onClick={() => signOut({ callbackUrl: '/login' })}
    >
      로그아웃
    </Button>
  )
}
