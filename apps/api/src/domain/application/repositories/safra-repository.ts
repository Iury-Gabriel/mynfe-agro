import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Safra } from '@/domain/enterprise/entities/safra'

export abstract class SafraRepository {
  abstract findById(id: string, tenantId: string): Promise<Safra | null>
  abstract findManyByTenant(tenantId: string, params: PaginationParams): Promise<Safra[]>
  abstract count(tenantId: string): Promise<number>
  abstract create(safra: Safra): Promise<void>
  abstract save(safra: Safra): Promise<void>
}
