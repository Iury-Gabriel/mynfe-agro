import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { CustoProducao } from '@/domain/enterprise/entities/custo-producao'

export abstract class CustoProducaoRepository {
  abstract findById(id: string, tenantId: string): Promise<CustoProducao | null>
  abstract findManyByTenant(tenantId: string, params: PaginationParams): Promise<CustoProducao[]>
  abstract count(tenantId: string): Promise<number>
  abstract create(custo: CustoProducao): Promise<void>
  abstract save(custo: CustoProducao): Promise<void>
}
