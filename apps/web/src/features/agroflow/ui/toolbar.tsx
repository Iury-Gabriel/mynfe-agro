import { Search } from 'lucide-react'

import type { ReactElement, ReactNode } from 'react'

interface ToolbarProps {
  placeholder?: string
  /** Slots à direita: selects de filtro, botões, etc. */
  children?: ReactNode
}

export function Toolbar({ placeholder = 'Buscar…', children }: ToolbarProps): ReactElement {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder={placeholder}
          className="h-10 w-full rounded-xl border border-border/70 bg-background/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </div>
  )
}
