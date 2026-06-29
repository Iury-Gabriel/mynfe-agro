import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

const actionButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-lime-400 to-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/25 hover:opacity-90 [&_svg]:text-emerald-950',
        ghost:
          'border border-border/70 bg-card/50 text-foreground hover:bg-card [&_svg]:text-muted-foreground',
        subtle: 'bg-white/5 text-foreground ring-1 ring-inset ring-white/10 hover:bg-white/10',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-9 px-3 text-xs',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'default' },
  },
)

export interface ActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof actionButtonVariants> {}

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(actionButtonVariants({ variant, size, className }))}
      {...props}
    />
  ),
)
ActionButton.displayName = 'ActionButton'
