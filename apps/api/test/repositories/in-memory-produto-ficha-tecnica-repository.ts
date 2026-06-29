import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { ProdutoFichaTecnica } from '@/domain/enterprise/entities/produto-ficha-tecnica'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { ProdutoFichaTecnicaRepository } from '@/domain/application/repositories/produto-ficha-tecnica-repository'

export class InMemoryProdutoFichaTecnicaRepository extends ProdutoFichaTecnicaRepository {
  fichas: ProdutoFichaTecnica[] = []
  shouldFailOnCreate = false
  shouldFailOnSave = false

  async findById(id: string, tenantId: string): Promise<ProdutoFichaTecnica | null> {
    return (
      this.fichas.find((f) => f.id.toString() === id && f.tenantId === tenantId) ?? null
    )
  }

  async findManyByProduto(
    tenantId: string,
    produtoId: string,
    params: PaginationParams,
  ): Promise<ProdutoFichaTecnica[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.fichas
      .filter((f) => f.tenantId === tenantId && f.produtoId === produtoId)
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async countByProduto(tenantId: string, produtoId: string): Promise<number> {
    return this.fichas.filter((f) => f.tenantId === tenantId && f.produtoId === produtoId)
      .length
  }

  async create(fichaTecnica: ProdutoFichaTecnica): Promise<void> {
    if (this.shouldFailOnCreate) throw new Error('create failed')
    this.fichas.push(fichaTecnica)
  }

  async save(fichaTecnica: ProdutoFichaTecnica): Promise<void> {
    if (this.shouldFailOnSave) throw new Error('save failed')
    const idx = this.fichas.findIndex((f) => f.id.equals(fichaTecnica.id))
    if (idx >= 0) this.fichas[idx] = fichaTecnica
    else this.fichas.push(fichaTecnica)
  }
}
