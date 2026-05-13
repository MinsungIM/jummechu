'use client'
import { useEffect, type ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

// 가벼운 hand-rolled modal — 추후 Radix Dialog 교체 가능
export function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md bg-surface-primary rounded-t-3xl sm:rounded-3xl shadow-tab p-6 max-h-[85vh] overflow-y-auto">
        {title && <h2 className="text-lg font-bold mb-4 text-ink">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
