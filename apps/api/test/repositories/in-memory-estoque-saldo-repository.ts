import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { EstoqueSaldoRepository } from '@/domain/application/repositories/estoque-saldo-repository'

export class InMemoryEstoqueSaldoRepository extends EstoqueSaldoRepository {
  saldos: EstoqueSaldo[] = []

  async findByChave(
    tenantId: string,
    empresaId: string,
    produtoId: string,
    loteId: string | null,
  ): Promise<EstoqueSaldo | null> {
    return (
      this.saldos.find(
        (s) =>
          s.tenantId === tenantId &&
          s.empresaId === empresaId &&
          s.produtoId === produtoId &&
          s.loteId === loteId,
      ) ?? null
    )
  }

  async findManyByEmpresa(
    tenantId: string,
    empresaId: string,
    params: PaginationParams,
  ): Promise<EstoqueSaldo[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.saldos
      .filter((s) => s.tenantId === tenantId && s.empresaId === empresaId)
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async count(tenantId: string, empresaId: string): Promise<number> {
    return this.saldos.filter((s) => s.tenantId === tenantId && s.empresaId === empresaId).length
  }
}
