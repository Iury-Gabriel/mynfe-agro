export interface DashboardPeriodo {
  periodoInicio: Date
  periodoFim: Date
}

export interface DashboardResumo {
  vendasNoPeriodo: number
  totalPedidos: number
  totalRemessas: number
  notasEmitidas: number
  notasPendentes: number
  posicaoEstoque: {
    totalLotes: number
    lotesVencendo: number
  }
  safrasEmAndamento: number
}

export abstract class DashboardRepository {
  abstract resumo(
    tenantId: string,
    empresaId: string,
    periodo: DashboardPeriodo,
  ): Promise<DashboardResumo>
}
