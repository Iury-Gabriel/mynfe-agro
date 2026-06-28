import { Sprout } from 'lucide-react'
import { useMemo } from 'react'

import { StatCard } from '../components/stat-card'

import type { Kpi } from '../mock'
import type { DashboardResumo } from '@/features/dashboard/api/dashboard-api'
import type { ReactElement } from 'react'

import { useDashboardResumo } from '@/features/dashboard/api/dashboard-api'
import { AjusteEmpresaGate } from '@/features/estoque/components/empresa-gate'
import { formatCurrency } from '@/features/vendas/lib/format'
import { useActiveEmpresaStore } from '@/stores/active-empresa-store'

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function currentMonthPeriodo(): { periodoInicio: string; periodoFim: string } {
  const now = new Date()
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1)
  const fim = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { periodoInicio: toIsoDate(inicio), periodoFim: toIsoDate(fim) }
}

function buildKpis(resumo: DashboardResumo): Kpi[] {
  return [
    {
      icon: 'trending',
      label: 'Vendas no mês',
      value: formatCurrency(resumo.vendasNoPeriodo),
      delta: { dir: 'neutral', label: '', suffix: `${resumo.totalPedidos} pedidos` },
    },
    {
      icon: 'file',
      label: 'Notas emitidas',
      value: String(resumo.notasEmitidas),
      valueSuffix: `/ ${resumo.notasPendentes} pend.`,
      delta: { dir: 'neutral', label: '', suffix: 'autorizadas' },
    },
    {
      icon: 'box',
      label: 'Estoque disponível',
      value: String(resumo.posicaoEstoque.totalLotes),
      valueSuffix: 'lotes',
      delta:
        resumo.posicaoEstoque.lotesVencendo > 0
          ? {
              dir: 'down',
              label: `${resumo.posicaoEstoque.lotesVencendo} vencendo`,
              suffix: 'próximos 7 dias',
            }
          : { dir: 'neutral', label: '', suffix: 'nenhum vencendo' },
    },
    {
      icon: 'list',
      label: 'A consolidar',
      value: String(resumo.totalRemessas),
      valueSuffix: 'remessas',
      delta: { dir: 'neutral', label: '', suffix: `${resumo.totalPedidos} pedidos no período` },
    },
  ]
}

function ResumoContent({ empresaId }: { empresaId: string }): ReactElement {
  const periodo = useMemo(currentMonthPeriodo, [])
  const { data, isLoading, isError, refetch } = useDashboardResumo({ empresaId, ...periodo })

  if (isLoading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Carregando resumo…</p>
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="text-sm text-destructive">Erro ao carregar o resumo do dashboard.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-xl border border-border/70 bg-card/50 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-card"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const kpis = buildKpis(data)
  const semDados =
    data.vendasNoPeriodo === 0 &&
    data.totalPedidos === 0 &&
    data.totalRemessas === 0 &&
    data.notasEmitidas === 0 &&
    data.notasPendentes === 0 &&
    data.posicaoEstoque.totalLotes === 0 &&
    data.safrasEmAndamento === 0

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-card/80 p-5 shadow-xl shadow-emerald-950/30">
        <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
          <Sprout className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Safras em andamento</p>
          <p className="text-xs text-muted-foreground">Lavouras ativas neste tenant</p>
        </div>
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {data.safrasEmAndamento}
        </span>
      </div>

      {semDados && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Nenhum movimento registrado no período para esta empresa.
        </p>
      )}
    </>
  )
}

export function DashboardHomePage(): ReactElement {
  const empresaId = useActiveEmpresaStore((s) => s.activeEmpresaId)

  return (
    <div className="agroflow agroflow-glow min-h-screen p-4 text-foreground sm:p-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Visão geral</h1>
        <span className="text-3xl sm:text-4xl" aria-hidden>
          🌾
        </span>
      </div>
      <p className="mt-2 text-muted-foreground">
        Resumo consolidado de vendas, fiscal, estoque e produção da empresa ativa.
      </p>

      <div className="mt-6">
        <AjusteEmpresaGate empresaId={empresaId}>
          {empresaId && <ResumoContent empresaId={empresaId} />}
        </AjusteEmpresaGate>
      </div>
    </div>
  )
}
