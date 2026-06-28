import type { DashboardResumo } from '@/domain/application/repositories/dashboard-repository'

export interface DashboardResumoPresenterOutput {
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

export class DashboardResumoPresenter {
  static toHTTP(resumo: DashboardResumo): DashboardResumoPresenterOutput {
    return {
      vendasNoPeriodo: resumo.vendasNoPeriodo,
      totalPedidos: resumo.totalPedidos,
      totalRemessas: resumo.totalRemessas,
      notasEmitidas: resumo.notasEmitidas,
      notasPendentes: resumo.notasPendentes,
      posicaoEstoque: {
        totalLotes: resumo.posicaoEstoque.totalLotes,
        lotesVencendo: resumo.posicaoEstoque.lotesVencendo,
      },
      safrasEmAndamento: resumo.safrasEmAndamento,
    }
  }
}
