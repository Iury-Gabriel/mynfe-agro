import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'

export abstract class EstoqueSaldoRepository {
  abstract findByChave(
    tenantId: string,
    empresaId: string,
    produtoId: string,
    loteId: string | null,
  ): Promise<EstoqueSaldo | null>
  abstract findManyByEmpresa(
    tenantId: string,
    empresaId: string,
    params: PaginationParams,
  ): Promise<EstoqueSaldo[]>
  abstract count(tenantId: string, empresaId: string): Promise<number>
}
