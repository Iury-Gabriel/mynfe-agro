import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Safra } from '@/domain/enterprise/entities/safra'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { SafraRepository } from '@/domain/application/repositories/safra-repository'

export class InMemorySafraRepository extends SafraRepository {
  safras: Safra[] = []
  shouldFailOnCreate = false
  shouldFailOnSave = false

  async findById(id: string, tenantId: string): Promise<Safra | null> {
    return this.safras.find((s) => s.id.toString() === id && s.tenantId === tenantId) ?? null
  }

  async findManyByTenant(tenantId: string, params: PaginationParams): Promise<Safra[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.safras
      .filter((s) => s.tenantId === tenantId)
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async count(tenantId: string): Promise<number> {
    return this.safras.filter((s) => s.tenantId === tenantId).length
  }

  async create(safra: Safra): Promise<void> {
    if (this.shouldFailOnCreate) throw new Error('create failed')
    this.safras.push(safra)
  }

  async save(safra: Safra): Promise<void> {
    if (this.shouldFailOnSave) throw new Error('save failed')
    const idx = this.safras.findIndex((s) => s.id.equals(safra.id))
    if (idx >= 0) this.safras[idx] = safra
    else this.safras.push(safra)
  }
}
