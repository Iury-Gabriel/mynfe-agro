import type { Tenant } from '@/domain/enterprise/entities/tenant'

import { TenantRepository } from '@/domain/application/repositories/tenant-repository'

export class InMemoryTenantRepository extends TenantRepository {
  tenants: Tenant[] = []
  shouldFailOnCreate = false
  shouldFailOnSave = false

  async findById(id: string): Promise<Tenant | null> {
    return this.tenants.find((t) => t.id.toString() === id) ?? null
  }

  async create(tenant: Tenant): Promise<void> {
    if (this.shouldFailOnCreate) throw new Error('create failed')
    this.tenants.push(tenant)
  }

  async save(tenant: Tenant): Promise<void> {
    if (this.shouldFailOnSave) throw new Error('save failed')
    const idx = this.tenants.findIndex((t) => t.id.equals(tenant.id))
    if (idx >= 0) this.tenants[idx] = tenant
    else this.tenants.push(tenant)
  }
}
