import type { HTMLAttributes } from 'react'

// mock_uiux/jummechu.pen comp_PartyCard 기준:
// - white BG, cornerRadius 16, padding 16, gap 12, light shadow
type Props = HTMLAttributes<HTMLDivElement>

export function Card({ className = '', ...props }: Props) {
  return (
    <div
      className={`bg-surface-primary rounded-2xl shadow-card p-4 flex flex-col gap-3 ${className}`}
      {...props}
    />
  )
}
