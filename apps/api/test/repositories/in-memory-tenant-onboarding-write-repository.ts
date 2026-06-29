import type { ProvisionTenantArgs } from '@/domain/application/repositories/tenant-onboarding-write-repository'

import { TenantOnboardingWriteRepository } from '@/domain/application/repositories/tenant-onboarding-write-repository'

export class InMemoryTenantOnboardingWriteRepository extends TenantOnboardingWriteRepository {
  provisioned: ProvisionTenantArgs[] = []
  shouldFailOnProvision = false

  async provision(args: ProvisionTenantArgs): Promise<void> {
    if (this.shouldFailOnProvision) throw new Error('provision failed')
    this.provisioned.push(args)
  }
}
