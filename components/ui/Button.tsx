import { forwardRef, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'dark' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  pill?: boolean
}

const variantClass: Record<Variant, string> = {
  // mock_uiux/jummechu.pen: 액션 버튼은 dark BG + white text (PartyCard "합류")
  primary: 'bg-accent-primary text-accent-onPrimary hover:brightness-95',
  secondary: 'bg-surface-secondary text-ink hover:bg-border-subtle',
  dark: 'bg-surface-inverse text-ink-inverse hover:brightness-110',
  ghost: 'bg-transparent text-ink hover:bg-surface-secondary',
}

const sizeClass: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs font-semibold',
  md: 'h-10 px-4 text-sm font-semibold',
  lg: 'h-12 px-5 text-base font-semibold',
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'dark', size = 'md', pill = false, className = '', ...props }, ref) => {
    const radius = pill ? 'rounded-pill' : 'rounded-xl'
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${radius} ${variantClass[variant]} ${sizeClass[size]} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
