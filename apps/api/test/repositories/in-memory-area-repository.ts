import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Area } from '@/domain/enterprise/entities/area'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { AreaRepository } from '@/domain/application/repositories/area-repository'

export class InMemoryAreaRepository extends AreaRepository {
  areas: Area[] = []
  shouldFailOnCreate = false
  shouldFailOnSave = false

  async findById(id: string, tenantId: string): Promise<Area | null> {
    return this.areas.find((a) => a.id.toString() === id && a.tenantId === tenantId) ?? null
  }

  async findManyByTenant(tenantId: string, params: PaginationParams): Promise<Area[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.areas
      .filter((a) => a.tenantId === tenantId)
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async count(tenantId: string): Promise<number> {
    return this.areas.filter((a) => a.tenantId === tenantId).length
  }

  async create(area: Area): Promise<void> {
    if (this.shouldFailOnCreate) throw new Error('create failed')
    this.areas.push(area)
  }

  async save(area: Area): Promise<void> {
    if (this.shouldFailOnSave) throw new Error('save failed')
    const idx = this.areas.findIndex((a) => a.id.equals(area.id))
    if (idx >= 0) this.areas[idx] = area
    else this.areas.push(area)
  }
}
