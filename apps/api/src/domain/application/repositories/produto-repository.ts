import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Produto } from '@/domain/enterprise/entities/produto'

export abstract class ProdutoRepository {
  abstract findById(id: string, tenantId: string): Promise<Produto | null>
  abstract findManyByTenant(tenantId: string, params: PaginationParams): Promise<Produto[]>
  abstract count(tenantId: string): Promise<number>
  abstract create(produto: Produto): Promise<void>
  abstract save(produto: Produto): Promise<void>
}
