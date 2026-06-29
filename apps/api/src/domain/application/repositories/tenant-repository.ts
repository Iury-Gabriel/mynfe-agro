import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { Tenant, TenantStatus } from '@/domain/enterprise/entities/tenant'

export interface TenantSummary {
  tenant: Tenant
  empresasCount: number
  usuariosCount: number
}

export abstract class TenantRepository {
  abstract findById(id: string): Promise<Tenant | null>
  abstract create(tenant: Tenant): Promise<void>
  abstract save(tenant: Tenant): Promise<void>
  abstract findManyPaginated(params: PaginationParams): Promise<TenantSummary[]>
  abstract count(): Promise<number>
  abstract updateStatus(id: string, status: TenantStatus): Promise<void>
}
