import { Boxes, FileText, ListChecks, TrendingDown, TrendingUp } from 'lucide-react'

import type { kpis } from '../mock'
import type { ReactElement } from 'react'

import { cn } from '@/lib/cn'


const ICONS = {
  trending: TrendingUp,
  list: ListChecks,
  file: FileText,
  box: Boxes,
}

type Kpi = (typeof kpis)[number]

export function StatCard({ icon, label, value, valueSuffix, delta }: Kpi): ReactElement {
  const Icon = ICONS[icon]
  const DeltaIcon = delta.dir === 'down' ? TrendingDown : TrendingUp

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-xl shadow-black/20 backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
          <Icon className="size-4" />
        </span>
      </div>

      <p className="mt-4 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
        {valueSuffix && <span className="text-sm font-medium text-muted-foreground">{valueSuffix}</span>}
      </p>

      <p className="mt-2 flex items-center gap-1.5 text-xs">
        {delta.dir !== 'neutral' && (
          <span
            className={cn(
              'inline-flex items-center gap-1 font-semibold',
              delta.dir === 'down' ? 'text-red-400' : 'text-emerald-400',
            )}
          >
            <DeltaIcon className="size-3.5" />
            {delta.label}
          </span>
        )}
        <span className="text-muted-foreground">{delta.suffix}</span>
      </p>
    </div>
  )
}
