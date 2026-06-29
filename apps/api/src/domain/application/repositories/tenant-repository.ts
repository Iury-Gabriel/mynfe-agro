import type { Tenant } from '@/domain/enterprise/entities/tenant'

export abstract class TenantRepository {
  abstract findById(id: string): Promise<Tenant | null>
  abstract create(tenant: Tenant): Promise<void>
  abstract save(tenant: Tenant): Promise<void>
}
