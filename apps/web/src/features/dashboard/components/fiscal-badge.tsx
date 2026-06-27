import type { FiscalStatus } from '../mock'
import type { ReactElement } from 'react'

import { cn } from '@/lib/cn'


const STYLES: Record<FiscalStatus, { label: string; className: string }> = {
  autorizada: {
    label: 'Autorizada',
    className: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/25',
  },
  pendente: {
    label: 'Pendente',
    className: 'bg-amber-500/10 text-amber-300 ring-amber-400/25',
  },
  rejeitada: {
    label: 'Rejeitada',
    className: 'bg-red-500/10 text-red-300 ring-red-400/25',
  },
}

export function FiscalBadge({ status }: { status: FiscalStatus }): ReactElement {
  const { label, className } = STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        className,
      )}
    >
      {label}
    </span>
  )
}
