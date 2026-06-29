import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { ProdutoFichaTecnica } from '@/domain/enterprise/entities/produto-ficha-tecnica'

export abstract class ProdutoFichaTecnicaRepository {
  abstract findById(id: string, tenantId: string): Promise<ProdutoFichaTecnica | null>
  abstract findManyByProduto(
    tenantId: string,
    produtoId: string,
    params: PaginationParams,
  ): Promise<ProdutoFichaTecnica[]>
  abstract countByProduto(tenantId: string, produtoId: string): Promise<number>
  abstract create(fichaTecnica: ProdutoFichaTecnica): Promise<void>
  abstract save(fichaTecnica: ProdutoFichaTecnica): Promise<void>
}
