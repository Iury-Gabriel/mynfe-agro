import { FileText, PackagePlus, Sprout, Truck } from 'lucide-react'

import type { ReactElement } from 'react'

const SECONDARY = [
  { icon: Truck, label: 'Nova remessa' },
  { icon: PackagePlus, label: 'Novo pedido' },
  { icon: Sprout, label: 'Registrar colheita' },
]

export function QuickActions(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {SECONDARY.map(({ icon: Icon, label }) => (
        <button
          key={label}
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/50 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-card"
        >
          <Icon className="size-4 text-muted-foreground" />
          {label}
        </button>
      ))}

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 px-4 py-2.5 text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-500/25 transition-opacity hover:opacity-90"
      >
        <FileText className="size-4" />
        Emitir DANFE
      </button>
    </div>
  )
}
