'use client'

// RatingForm — 별점 + 태그 입력 + (메뉴면) comment
// functional-design.md §3
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { RatingStars } from './RatingStars'

type Mode = 'restaurant' | 'menu'

export type RatingFormSubmit = {
  stars: number | null
  tagLabels: string[]
  comment: string | null
}

type Props = {
  mode: Mode
  initialStars?: number | null
  initialTags?: string[]
  initialComment?: string | null
  busy?: boolean
  onSubmit: (input: RatingFormSubmit) => void | Promise<void>
  onCancel?: () => void
}

export function RatingForm({
  mode,
  initialStars = null,
  initialTags = [],
  initialComment = null,
  busy = false,
  onSubmit,
  onCancel,
}: Props) {
  const [stars, setStars] = useState<number>(initialStars ?? 0)
  const [tagInput, setTagInput] = useState<string>('')
  const [tags, setTags] = useState<string[]>(initialTags)
  const [comment, setComment] = useState<string>(initialComment ?? '')
  const [err, setErr] = useState<string | null>(null)

  const isMenu = mode === 'menu'

  function addTag() {
    const label = tagInput.trim().replace(/^#+/, '')
    if (!label) return
    if (label.length > 30) {
      setErr('태그는 30자 이내')
      return
    }
    if (tags.length >= 10) {
      setErr('태그는 최대 10개')
      return
    }
    const withHash = label.startsWith('#') ? label : `#${label}`
    if (tags.includes(withHash)) {
      setTagInput('')
      return
    }
    setTags([...tags, withHash])
    setTagInput('')
    setErr(null)
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErr(null)

    if (isMenu) {
      if (stars < 1 || stars > 5) {
        setErr('메뉴 평가는 별점 1~5점 필수')
        return
      }
    } else {
      // 식당: 별점 또는 태그 중 하나는 있어야 의미가 있음
      if (stars < 1 && tags.length === 0) {
        setErr('별점 또는 태그 중 최소 하나는 입력')
        return
      }
    }
    if (comment.length > 200) {
      setErr('코멘트는 200자 이내')
      return
    }

    await onSubmit({
      stars: stars >= 1 && stars <= 5 ? stars : null,
      tagLabels: tags,
      comment: comment.trim() ? comment.trim() : null,
    })
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-secondary font-semibold">별점</label>
          <RatingStars value={stars} onChange={setStars} size="lg" />
        </div>

        {!isMenu && (
          <div className="flex flex-col gap-2">
            <label className="text-xs text-ink-secondary font-semibold">태그</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="예: 가성비"
                maxLength={30}
                className="flex-1 h-10 px-3 rounded-xl bg-surface-secondary border border-border-subtle text-sm"
              />
              <Button type="button" variant="secondary" size="md" onClick={addTag}>
                추가
              </Button>
            </div>
            {tags.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <li key={t}>
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="inline-flex items-center gap-1 rounded-pill bg-accent-primary text-accent-onPrimary px-3 py-1 text-xs font-semibold"
                      aria-label={`${t} 제거`}
                    >
                      {t}
                      <span aria-hidden="true">×</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {isMenu && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-secondary font-semibold">한 줄 코멘트 (선택)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              maxLength={200}
              className="w-full rounded-xl bg-surface-secondary border border-border-subtle text-sm px-3 py-2"
              placeholder="200자 이내"
            />
            <span className="text-xs text-ink-muted self-end">{comment.length} / 200</span>
          </div>
        )}

        {err && <p className="text-xs text-red-600">{err}</p>}

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="md" onClick={onCancel} disabled={busy}>
              취소
            </Button>
          )}
          <Button type="submit" variant="dark" size="md" disabled={busy}>
            {busy ? '저장 중…' : '저장'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
