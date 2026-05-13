import { forwardRef, type InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? props.name
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-ink-secondary px-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-12 px-4 rounded-xl bg-surface-primary border border-border-subtle text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink focus:ring-2 focus:ring-accent-primary/30 transition ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-category-han px-1">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
