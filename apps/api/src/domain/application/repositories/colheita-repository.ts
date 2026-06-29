import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Colheita } from '@/domain/enterprise/entities/colheita'

export abstract class ColheitaRepository {
  abstract findById(id: string, tenantId: string): Promise<Colheita | null>
  abstract findManyByEmpresa(
    tenantId: string,
    empresaId: string,
    params: PaginationParams,
  ): Promise<Colheita[]>
  abstract count(tenantId: string, empresaId: string): Promise<number>
}
