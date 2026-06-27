import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Area } from '@/domain/enterprise/entities/area'

export abstract class AreaRepository {
  abstract findById(id: string, tenantId: string): Promise<Area | null>
  abstract findManyByTenant(tenantId: string, params: PaginationParams): Promise<Area[]>
  abstract count(tenantId: string): Promise<number>
  abstract create(area: Area): Promise<void>
  abstract save(area: Area): Promise<void>
}
