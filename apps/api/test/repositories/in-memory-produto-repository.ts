import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Produto } from '@/domain/enterprise/entities/produto'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'

export class InMemoryProdutoRepository extends ProdutoRepository {
  produtos: Produto[] = []
  shouldFailOnCreate = false
  shouldFailOnSave = false

  async findById(id: string, tenantId: string): Promise<Produto | null> {
    return (
      this.produtos.find((p) => p.id.toString() === id && p.tenantId === tenantId) ?? null
    )
  }

  async findManyByTenant(tenantId: string, params: PaginationParams): Promise<Produto[]> {
    const { page, perPage } = normalizePagination(params)
    const ordered = this.produtos
      .filter((p) => p.tenantId === tenantId)
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage)
  }

  async count(tenantId: string): Promise<number> {
    return this.produtos.filter((p) => p.tenantId === tenantId).length
  }

  async create(produto: Produto): Promise<void> {
    if (this.shouldFailOnCreate) throw new Error('create failed')
    this.produtos.push(produto)
  }

  async save(produto: Produto): Promise<void> {
    if (this.shouldFailOnSave) throw new Error('save failed')
    const idx = this.produtos.findIndex((p) => p.id.equals(produto.id))
    if (idx >= 0) this.produtos[idx] = produto
    else this.produtos.push(produto)
  }
}
