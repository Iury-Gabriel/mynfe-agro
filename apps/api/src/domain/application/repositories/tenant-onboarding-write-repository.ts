import type { Permission } from '@/core/auth/permissions'
import type { Empresa } from '@/domain/enterprise/entities/empresa'
import type { Tenant } from '@/domain/enterprise/entities/tenant'

export interface ProvisionTenantArgs {
  userId: string
  tenant: Tenant
  empresa: Empresa
  roleName: string
  permissions: readonly Permission[]
}

export abstract class TenantOnboardingWriteRepository {
  abstract provision(args: ProvisionTenantArgs): Promise<void>
}
