import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Lote } from '@/domain/enterprise/entities/lote'

export abstract class LoteRepository {
  abstract findById(id: string, tenantId: string): Promise<Lote | null>
  abstract findByCodigo(
    tenantId: string,
    empresaId: string,
    codigoLote: string,
  ): Promise<Lote | null>
  abstract findManyByEmpresa(
    tenantId: string,
    empresaId: string,
    params: PaginationParams,
  ): Promise<Lote[]>
  abstract count(tenantId: string, empresaId: string): Promise<number>
  abstract save(lote: Lote): Promise<void>
}
