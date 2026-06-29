import { Injectable } from '@nestjs/common'

import { PrismaService } from '../prisma.service'

import type {
  DashboardPeriodo,
  DashboardResumo,
} from '@/domain/application/repositories/dashboard-repository'

import { DashboardRepository } from '@/domain/application/repositories/dashboard-repository'

const DIAS_VENCIMENTO = 7

@Injectable()
export class PrismaDashboardRepository extends DashboardRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async resumo(
    tenantId: string,
    empresaId: string,
    periodo: DashboardPeriodo,
  ): Promise<DashboardResumo> {
    const periodoData = { gte: periodo.periodoInicio, lte: periodo.periodoFim }
    const limiteVencimento = new Date(periodo.periodoFim)
    limiteVencimento.setDate(limiteVencimento.getDate() + DIAS_VENCIMENTO)

    const [
      vendas,
      totalPedidos,
      totalRemessas,
      notasEmitidas,
      notasPendentes,
      totalLotes,
      lotesVencendo,
      safrasEmAndamento,
    ] = await Promise.all([
      this.prisma.pedido.aggregate({
        _sum: { valorTotal: true },
        where: {
          tenantId,
          empresaFaturadoraId: empresaId,
          deletedAt: null,
          status: { in: ['confirmado', 'faturado'] },
          data: periodoData,
        },
      }),
      this.prisma.pedido.count({
        where: {
          tenantId,
          empresaFaturadoraId: empresaId,
          deletedAt: null,
          data: periodoData,
        },
      }),
      this.prisma.remessa.count({
        where: {
          tenantId,
          empresaFaturadoraId: empresaId,
          deletedAt: null,
          data: periodoData,
        },
      }),
      this.prisma.notaFiscal.count({
        where: {
          tenantId,
          empresaEmitenteId: empresaId,
          deletedAt: null,
          status: 'autorizada',
        },
      }),
      this.prisma.notaFiscal.count({
        where: {
          tenantId,
          empresaEmitenteId: empresaId,
          deletedAt: null,
          status: { in: ['pendente', 'emitindo', 'rejeitada'] },
        },
      }),
      this.prisma.lote.count({ where: { tenantId, empresaId, deletedAt: null } }),
      this.prisma.lote.count({
        where: { tenantId, empresaId, deletedAt: null, validade: { not: null, lte: limiteVencimento } },
      }),
      this.prisma.safra.count({ where: { tenantId, status: 'em_andamento', deletedAt: null } }),
    ])

    return {
      vendasNoPeriodo: vendas._sum.valorTotal?.toNumber() ?? 0,
      totalPedidos,
      totalRemessas,
      notasEmitidas,
      notasPendentes,
      posicaoEstoque: {
        totalLotes,
        lotesVencendo,
      },
      safrasEmAndamento,
    }
  }
}
