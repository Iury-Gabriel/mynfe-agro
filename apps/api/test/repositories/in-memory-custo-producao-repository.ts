import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { CustoProducao } from '@/domain/enterprise/entities/custo-producao'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { CustoProducaoRepository } from '@/domain/application/repositories/custo-producao-repository'

export class InMemoryCustoProducaoRepository extends CustoProducaoRepository {
  custos: CustoProducao[] = []
  shouldFailOnCreate = false
  shouldFailOnSave = false

  async findById(id: string, tenantId: string): Promise<CustoProducao | null> {
    return this.custos.find((c) => c.id.toString() === id && c.tenantId === tenantId) ?? null
  }

  async findManyByTenant(tenantId: string, params: PaginationParams): Promise<CustoProducao[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.custos
      .filter((c) => c.tenantId === tenantId)
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async count(tenantId: string): Promise<number> {
    return this.custos.filter((c) => c.tenantId === tenantId).length
  }

  async create(custo: CustoProducao): Promise<void> {
    if (this.shouldFailOnCreate) throw new Error('create failed')
    this.custos.push(custo)
  }

  async save(custo: CustoProducao): Promise<void> {
    if (this.shouldFailOnSave) throw new Error('save failed')
    const idx = this.custos.findIndex((c) => c.id.equals(custo.id))
    if (idx >= 0) this.custos[idx] = custo
    else this.custos.push(custo)
  }
}
