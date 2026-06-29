import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Fazenda } from '@/domain/enterprise/entities/fazenda'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { FazendaRepository } from '@/domain/application/repositories/fazenda-repository'

export class InMemoryFazendaRepository extends FazendaRepository {
  fazendas: Fazenda[] = []
  shouldFailOnCreate = false
  shouldFailOnSave = false

  async findById(id: string, tenantId: string): Promise<Fazenda | null> {
    return this.fazendas.find((f) => f.id.toString() === id && f.tenantId === tenantId) ?? null
  }

  async findManyByTenant(tenantId: string, params: PaginationParams): Promise<Fazenda[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.fazendas
      .filter((f) => f.tenantId === tenantId)
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async count(tenantId: string): Promise<number> {
    return this.fazendas.filter((f) => f.tenantId === tenantId).length
  }

  async create(fazenda: Fazenda): Promise<void> {
    if (this.shouldFailOnCreate) throw new Error('create failed')
    this.fazendas.push(fazenda)
  }

  async save(fazenda: Fazenda): Promise<void> {
    if (this.shouldFailOnSave) throw new Error('save failed')
    const idx = this.fazendas.findIndex((f) => f.id.equals(fazenda.id))
    if (idx >= 0) this.fazendas[idx] = fazenda
    else this.fazendas.push(fazenda)
  }
}
