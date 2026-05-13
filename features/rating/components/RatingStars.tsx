'use client'

// RatingStars — 1~5 별점 입력/표시
// functional-design.md §3
import { useState } from 'react'

type Size = 'sm' | 'md' | 'lg'

type Props = {
  value: number
  onChange?: (next: number) => void
  size?: Size
  readOnly?: boolean
  ariaLabel?: string
}

const sizeClass: Record<Size, string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl',
}

export function RatingStars({ value, onChange, size = 'md', readOnly = false, ariaLabel }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const display = hover ?? value
  const interactive = !readOnly && typeof onChange === 'function'

  return (
    <div
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={ariaLabel ?? `별점 ${value} / 5`}
      className={`inline-flex items-center gap-1 ${sizeClass[size]}`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= display
        const cls = filled ? 'text-accent-primary' : 'text-border-subtle'
        if (!interactive) {
          return (
            <span key={star} aria-hidden="true" className={cls}>
              {filled ? '★' : '☆'}
            </span>
          )
        }
        return (
          <button
            type="button"
            key={star}
            role="radio"
            aria-checked={star === value}
            aria-label={`별점 ${star}`}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(star)}
            onBlur={() => setHover(null)}
            onClick={() => onChange?.(star)}
            className={`leading-none transition ${cls} hover:scale-110`}
          >
            {filled ? '★' : '☆'}
          </button>
        )
      })}
    </div>
  )
}
