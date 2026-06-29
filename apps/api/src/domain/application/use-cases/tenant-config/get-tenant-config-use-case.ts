import { Injectable } from '@nestjs/common'

import type { Tenant } from '@/domain/enterprise/entities/tenant'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { TenantRepository } from '@/domain/application/repositories/tenant-repository'
import { TenantNotFoundError } from '@/domain/application/use-cases/errors/tenant-not-found-error'

export interface GetTenantConfigInput {
  tenantId: string
}

export interface GetTenantConfigOutput {
  tenant: Tenant
}

type GetTenantConfigResult = Either<TenantNotFoundError | UnexpectedError, GetTenantConfigOutput>

@Injectable()
export class GetTenantConfigUseCase {
  constructor(private readonly tenants: TenantRepository) {}

  async execute(input: GetTenantConfigInput): Promise<GetTenantConfigResult> {
    try {
      const tenant = await this.tenants.findById(input.tenantId)
      if (!tenant) return left(new TenantNotFoundError())

      return right({ tenant })
    } catch (err) {
      console.error('[GetTenantConfigUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
