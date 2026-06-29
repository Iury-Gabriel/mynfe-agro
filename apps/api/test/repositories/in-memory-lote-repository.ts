import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Lote } from '@/domain/enterprise/entities/lote'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { LoteRepository } from '@/domain/application/repositories/lote-repository'

export class InMemoryLoteRepository extends LoteRepository {
  lotes: Lote[] = []
  shouldFailOnSave = false

  async findById(id: string, tenantId: string): Promise<Lote | null> {
    return this.lotes.find((l) => l.id.toString() === id && l.tenantId === tenantId) ?? null
  }

  async findByCodigo(tenantId: string, empresaId: string, codigoLote: string): Promise<Lote | null> {
    return (
      this.lotes.find(
        (l) => l.tenantId === tenantId && l.empresaId === empresaId && l.codigoLote === codigoLote,
      ) ?? null
    )
  }

  async findManyByEmpresa(
    tenantId: string,
    empresaId: string,
    params: PaginationParams,
  ): Promise<Lote[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.lotes
      .filter((l) => l.tenantId === tenantId && l.empresaId === empresaId)
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async count(tenantId: string, empresaId: string): Promise<number> {
    return this.lotes.filter((l) => l.tenantId === tenantId && l.empresaId === empresaId).length
  }

  async save(lote: Lote): Promise<void> {
    if (this.shouldFailOnSave) throw new Error('save failed')
    const idx = this.lotes.findIndex((l) => l.id.equals(lote.id))
    if (idx >= 0) this.lotes[idx] = lote
    else this.lotes.push(lote)
  }
}
