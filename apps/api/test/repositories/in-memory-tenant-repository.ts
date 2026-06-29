import type { PaginationParams } from '@/core/repositories/pagination-params'
import type {
  TenantRepository as TenantRepositoryType,
  TenantSummary,
} from '@/domain/application/repositories/tenant-repository'
import type { Tenant, TenantStatus } from '@/domain/enterprise/entities/tenant'

import { normalizePagination } from '@/core/repositories/pagination-params'
import { TenantRepository } from '@/domain/application/repositories/tenant-repository'

export class InMemoryTenantRepository extends TenantRepository implements TenantRepositoryType {
  tenants: Tenant[] = []
  empresasCounts = new Map<string, number>()
  usuariosCounts = new Map<string, number>()
  shouldFailOnCreate = false
  shouldFailOnSave = false
  shouldFailOnUpdateStatus = false
  shouldFailOnFindMany = false

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

  async findManyPaginated(params: PaginationParams): Promise<TenantSummary[]> {
    if (this.shouldFailOnFindMany) throw new Error('findManyPaginated failed')
    const { page, perPage } = normalizePagination(params)
    const ordered = [...this.tenants].sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime(),
    )
    const start = (page - 1) * perPage
    return ordered.slice(start, start + perPage).map((tenant) => ({
      tenant,
      empresasCount: this.empresasCounts.get(tenant.id.toString()) ?? 0,
      usuariosCount: this.usuariosCounts.get(tenant.id.toString()) ?? 0,
    }))
  }

  async count(): Promise<number> {
    return this.tenants.length
  }

  async updateStatus(id: string, status: TenantStatus): Promise<void> {
    if (this.shouldFailOnUpdateStatus) throw new Error('updateStatus failed')
    const tenant = this.tenants.find((t) => t.id.toString() === id)
    if (tenant) {
      if (status === 'suspenso') tenant.suspend()
      else if (status === 'ativo') tenant.activate()
      else tenant.deactivate()
    }
  }
}
