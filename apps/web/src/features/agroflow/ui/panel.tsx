import type { ReactElement, ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface PanelProps {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: PanelProps): ReactElement {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border/60 bg-card/70 shadow-xl shadow-black/20 backdrop-blur-sm',
        className,
      )}
    >
      {(title != null || action != null) && (
        <header className="flex items-center justify-between gap-3 border-b border-border/50 px-5 py-4 sm:px-6">
          <div>
            {title && <h2 className="text-base font-bold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn('p-5 sm:p-6', bodyClassName)}>{children}</div>
    </section>
  )
}
