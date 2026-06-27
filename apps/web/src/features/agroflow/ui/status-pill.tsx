import type { ReactElement, ReactNode } from 'react'

import { cn } from '@/lib/cn'

export type PillTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

const TONES: Record<PillTone, string> = {
  success: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/25',
  warning: 'bg-amber-500/10 text-amber-300 ring-amber-400/25',
  danger: 'bg-red-500/10 text-red-300 ring-red-400/25',
  neutral: 'bg-white/5 text-muted-foreground ring-white/10',
  info: 'bg-sky-500/10 text-sky-300 ring-sky-400/25',
}

interface StatusPillProps {
  tone?: PillTone
  children: ReactNode
  className?: string
}

export function StatusPill({ tone = 'neutral', children, className }: StatusPillProps): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
