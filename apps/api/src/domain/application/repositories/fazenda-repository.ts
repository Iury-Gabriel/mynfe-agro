import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Fazenda } from '@/domain/enterprise/entities/fazenda'

export abstract class FazendaRepository {
  abstract findById(id: string, tenantId: string): Promise<Fazenda | null>
  abstract findManyByTenant(tenantId: string, params: PaginationParams): Promise<Fazenda[]>
  abstract count(tenantId: string): Promise<number>
  abstract create(fazenda: Fazenda): Promise<void>
  abstract save(fazenda: Fazenda): Promise<void>
}
