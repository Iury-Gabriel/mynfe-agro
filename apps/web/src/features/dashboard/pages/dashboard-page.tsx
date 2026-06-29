import { AttentionList } from '../components/attention-list'
import { FechamentoCard } from '../components/fechamento-card'
import { QuickActions } from '../components/quick-actions'
import { RecentOrders } from '../components/recent-orders'
import { StatCard } from '../components/stat-card'
import { greeting, kpis } from '../mock'

import type { ReactElement } from 'react'

export function DashboardPage(): ReactElement {
  return (
    <>
      {/* Saudação */}
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Bom dia, {greeting.name}</h1>
        <span className="text-3xl sm:text-4xl" aria-hidden>
          🌾
        </span>
      </div>
      <p className="mt-2 text-muted-foreground">
        {greeting.dateLabel} ·{' '}
        <span className="font-semibold text-emerald-300">{greeting.summary.remessas} remessas</span>{' '}
        aguardando consolidação e{' '}
        <span className="font-semibold text-emerald-300">{greeting.summary.notas} notas</span> pendentes.
      </p>

      {/* Ações rápidas */}
      <div className="mt-6">
        <QuickActions />
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Conteúdo principal */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrders />
        </div>
        <div className="space-y-6">
          <FechamentoCard />
          <AttentionList />
        </div>
      </div>
    </>
  )
}
