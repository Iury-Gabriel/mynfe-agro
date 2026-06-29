import { fechamento } from '../mock'

import type { ReactElement } from 'react'


export function FechamentoCard(): ReactElement {
  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-card/80 p-6 shadow-xl shadow-emerald-950/30">
      <p className="text-sm font-medium text-emerald-200/80">Fechamento de {fechamento.mes}</p>
      <p className="mt-2 text-4xl font-bold tracking-tight text-foreground">{fechamento.valor}</p>
      <p className="mt-2 text-sm text-muted-foreground">{fechamento.resumo}</p>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-emerald-950/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-lime-400 to-emerald-400"
          style={{ width: `${fechamento.progresso}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{fechamento.corteLabel}</span>
        <span>{fechamento.restante}</span>
      </div>

      <button
        type="button"
        className="mt-5 w-full rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 py-3 text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-500/25 transition-opacity hover:opacity-90"
      >
        Consolidar agora
      </button>
    </section>
  )
}
