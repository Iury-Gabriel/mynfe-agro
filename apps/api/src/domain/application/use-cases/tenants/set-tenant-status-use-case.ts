import { Injectable } from '@nestjs/common'

import type { Tenant } from '@/domain/enterprise/entities/tenant'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { TenantRepository } from '@/domain/application/repositories/tenant-repository'
import { TenantNotFoundError } from '@/domain/application/use-cases/errors/tenant-not-found-error'

export type SetTenantStatusValue = 'ativo' | 'suspenso'

export interface SetTenantStatusInput {
  tenantId: string
  status: SetTenantStatusValue
}

export interface SetTenantStatusOutput {
  tenant: Tenant
}

type SetTenantStatusResult = Either<TenantNotFoundError | UnexpectedError, SetTenantStatusOutput>

@Injectable()
export class SetTenantStatusUseCase {
  constructor(private readonly tenants: TenantRepository) {}

  async execute(input: SetTenantStatusInput): Promise<SetTenantStatusResult> {
    const tenant = await this.tenants.findById(input.tenantId)
    if (!tenant) return left(new TenantNotFoundError())

    if (input.status === 'suspenso') tenant.suspend()
    else tenant.activate()

    try {
      await this.tenants.updateStatus(tenant.id.toString(), tenant.status)
      return right({ tenant })
    } catch (err) {
      console.error('[SetTenantStatusUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
