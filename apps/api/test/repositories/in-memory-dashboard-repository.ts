import type { InMemoryLoteRepository } from './in-memory-lote-repository'
import type { InMemoryNotaFiscalRepository } from './in-memory-nota-fiscal-repository'
import type { InMemoryPedidoRepository } from './in-memory-pedido-repository'
import type { InMemoryRemessaRepository } from './in-memory-remessa-repository'
import type { InMemorySafraRepository } from './in-memory-safra-repository'
import type {
  DashboardPeriodo,
  DashboardResumo,
} from '@/domain/application/repositories/dashboard-repository'

import { DashboardRepository } from '@/domain/application/repositories/dashboard-repository'

const DIAS_VENCIMENTO = 7

function dentroDoPeriodo(data: Date, periodo: DashboardPeriodo): boolean {
  return data >= periodo.periodoInicio && data <= periodo.periodoFim
}

export class InMemoryDashboardRepository extends DashboardRepository {
  constructor(
    private readonly pedidos: InMemoryPedidoRepository,
    private readonly remessas: InMemoryRemessaRepository,
    private readonly notas: InMemoryNotaFiscalRepository,
    private readonly lotes: InMemoryLoteRepository,
    private readonly safras: InMemorySafraRepository,
  ) {
    super()
  }

  async resumo(
    tenantId: string,
    empresaId: string,
    periodo: DashboardPeriodo,
  ): Promise<DashboardResumo> {
    const pedidosEmpresa = this.pedidos.pedidos.filter(
      (p) =>
        p.tenantId === tenantId &&
        p.empresaFaturadoraId === empresaId &&
        p.deletedAt === null &&
        dentroDoPeriodo(p.data, periodo),
    )
    const faturados = pedidosEmpresa.filter(
      (p) => p.status === 'confirmado' || p.status === 'faturado',
    )
    const vendasNoPeriodo = faturados.reduce((soma, p) => soma + p.valorTotal, 0)

    const totalRemessas = this.remessas.remessas.filter(
      (r) =>
        r.tenantId === tenantId &&
        r.empresaFaturadoraId === empresaId &&
        r.deletedAt === null &&
        dentroDoPeriodo(r.data, periodo),
    ).length

    const notasEmpresa = this.notas.notas.filter(
      (n) =>
        n.tenantId === tenantId && n.empresaEmitenteId === empresaId && n.deletedAt === null,
    )
    const notasEmitidas = notasEmpresa.filter((n) => n.status === 'autorizada').length
    const notasPendentes = notasEmpresa.filter(
      (n) => n.status === 'pendente' || n.status === 'emitindo' || n.status === 'rejeitada',
    ).length

    const lotesEmpresa = this.lotes.lotes.filter(
      (l) => l.tenantId === tenantId && l.empresaId === empresaId && l.deletedAt === null,
    )
    const limiteVencimento = new Date(periodo.periodoFim)
    limiteVencimento.setDate(limiteVencimento.getDate() + DIAS_VENCIMENTO)
    const lotesVencendo = lotesEmpresa.filter(
      (l) => l.validade !== null && l.validade <= limiteVencimento,
    ).length

    const safrasEmAndamento = this.safras.safras.filter(
      (s) => s.tenantId === tenantId && s.status === 'em_andamento' && s.deletedAt === null,
    ).length

    return {
      vendasNoPeriodo,
      totalPedidos: pedidosEmpresa.length,
      totalRemessas,
      notasEmitidas,
      notasPendentes,
      posicaoEstoque: {
        totalLotes: lotesEmpresa.length,
        lotesVencendo,
      },
      safrasEmAndamento,
    }
  }
}
