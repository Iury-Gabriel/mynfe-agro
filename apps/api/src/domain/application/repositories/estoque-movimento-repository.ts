import type { PaginationParams } from '@/core/repositories/pagination-params'
import type {
  EstoqueMovimento,
  EstoqueMovimentoOrigem,
  EstoqueMovimentoTipo,
} from '@/domain/enterprise/entities/estoque-movimento'

export interface EstoqueMovimentoFiltros {
  produtoId?: string
  loteId?: string
  tipo?: EstoqueMovimentoTipo
  origem?: EstoqueMovimentoOrigem
}

export abstract class EstoqueMovimentoRepository {
  abstract findManyByEmpresa(
    tenantId: string,
    empresaId: string,
    filtros: EstoqueMovimentoFiltros,
    params: PaginationParams,
  ): Promise<EstoqueMovimento[]>
  abstract count(
    tenantId: string,
    empresaId: string,
    filtros: EstoqueMovimentoFiltros,
  ): Promise<number>
}
