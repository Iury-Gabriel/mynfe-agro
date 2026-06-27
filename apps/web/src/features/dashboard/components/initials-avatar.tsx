import type { ReactElement } from 'react'

import { cn } from '@/lib/cn'

interface InitialsAvatarProps {
  initials: string
  className?: string
}

export function InitialsAvatar({ initials, className }: InitialsAvatarProps): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/20',
        className,
      )}
    >
      {initials}
    </span>
  )
}
