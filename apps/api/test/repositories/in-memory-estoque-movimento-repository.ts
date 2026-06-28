import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { EstoqueMovimentoFiltros } from '@/domain/application/repositories/estoque-movimento-repository'
import type { EstoqueMovimento } from '@/domain/enterprise/entities/estoque-movimento'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { EstoqueMovimentoRepository } from '@/domain/application/repositories/estoque-movimento-repository'

function matchesFiltros(movimento: EstoqueMovimento, filtros: EstoqueMovimentoFiltros): boolean {
  if (filtros.produtoId !== undefined && movimento.produtoId !== filtros.produtoId) return false
  if (filtros.loteId !== undefined && movimento.loteId !== filtros.loteId) return false
  if (filtros.tipo !== undefined && movimento.tipo !== filtros.tipo) return false
  if (filtros.origem !== undefined && movimento.origem !== filtros.origem) return false
  return true
}

export class InMemoryEstoqueMovimentoRepository extends EstoqueMovimentoRepository {
  movimentos: EstoqueMovimento[] = []

  async findManyByEmpresa(
    tenantId: string,
    empresaId: string,
    filtros: EstoqueMovimentoFiltros,
    params: PaginationParams,
  ): Promise<EstoqueMovimento[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.movimentos
      .filter((m) => m.tenantId === tenantId && m.empresaId === empresaId && matchesFiltros(m, filtros))
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async count(
    tenantId: string,
    empresaId: string,
    filtros: EstoqueMovimentoFiltros,
  ): Promise<number> {
    return this.movimentos.filter(
      (m) => m.tenantId === tenantId && m.empresaId === empresaId && matchesFiltros(m, filtros),
    ).length
  }
}
