import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { AtividadeCampo } from '@/domain/enterprise/entities/atividade-campo'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { AtividadeCampoRepository } from '@/domain/application/repositories/atividade-campo-repository'

export class InMemoryAtividadeCampoRepository extends AtividadeCampoRepository {
  atividades: AtividadeCampo[] = []
  shouldFailOnCreate = false
  shouldFailOnSave = false

  async findById(id: string, tenantId: string): Promise<AtividadeCampo | null> {
    return this.atividades.find((a) => a.id.toString() === id && a.tenantId === tenantId) ?? null
  }

  async findManyByTenant(tenantId: string, params: PaginationParams): Promise<AtividadeCampo[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.atividades
      .filter((a) => a.tenantId === tenantId)
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async count(tenantId: string): Promise<number> {
    return this.atividades.filter((a) => a.tenantId === tenantId).length
  }

  async create(atividade: AtividadeCampo): Promise<void> {
    if (this.shouldFailOnCreate) throw new Error('create failed')
    this.atividades.push(atividade)
  }

  async save(atividade: AtividadeCampo): Promise<void> {
    if (this.shouldFailOnSave) throw new Error('save failed')
    const idx = this.atividades.findIndex((a) => a.id.equals(atividade.id))
    if (idx >= 0) this.atividades[idx] = atividade
    else this.atividades.push(atividade)
  }
}
