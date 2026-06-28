import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Colheita } from '@/domain/enterprise/entities/colheita'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { ColheitaRepository } from '@/domain/application/repositories/colheita-repository'

export class InMemoryColheitaRepository extends ColheitaRepository {
  colheitas: Colheita[] = []

  async findById(id: string, tenantId: string): Promise<Colheita | null> {
    return this.colheitas.find((c) => c.id.toString() === id && c.tenantId === tenantId) ?? null
  }

  async findManyByEmpresa(
    tenantId: string,
    empresaId: string,
    params: PaginationParams,
  ): Promise<Colheita[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.colheitas
      .filter((c) => c.tenantId === tenantId && c.empresaId === empresaId)
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async count(tenantId: string, empresaId: string): Promise<number> {
    return this.colheitas.filter((c) => c.tenantId === tenantId && c.empresaId === empresaId).length
  }
}
