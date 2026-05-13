// SearchInput — 해시태그 검색 입력 (S8 진입). form submit 시 /restaurants/search?tag=… 로 이동
'use client'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

type Props = {
  initialValue?: string
  placeholder?: string
}

export function SearchInput({ initialValue = '', placeholder = '해시태그 검색' }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(initialValue)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = value.trim().replace(/^#/, '').trim()
    if (!trimmed) return
    router.push(`/restaurants/search?tag=${encodeURIComponent(trimmed)}`)
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex items-center gap-2 bg-surface-primary rounded-pill h-12 px-5 shadow-card">
        <span className="text-ink-muted text-base">#</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-ink-muted"
        />
        <button
          type="submit"
          className="text-xs font-semibold text-ink-secondary hover:text-ink transition"
        >
          검색
        </button>
      </div>
    </form>
  )
}
