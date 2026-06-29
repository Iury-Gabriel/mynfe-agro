import { Injectable } from '@nestjs/common'

import type { Tenant } from '@/domain/enterprise/entities/tenant'
import type { User } from '@/domain/enterprise/entities/user'

import { right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import {
  OnboardTenantService,
  type OnboardTenantInput,
} from '@/domain/application/services/onboard-tenant-service'
import { EmailAlreadyInUseError } from '@/domain/application/use-cases/errors/email-already-in-use-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'

export type CreateTenantInput = OnboardTenantInput

export interface CreateTenantOutput {
  user: User
  tenant: Tenant
}

type CreateTenantResult = Either<
  EmailAlreadyInUseError | InvalidCnpjCpfError | UnexpectedError,
  CreateTenantOutput
>

@Injectable()
export class CreateTenantUseCase {
  constructor(private readonly onboardTenant: OnboardTenantService) {}

  async execute(input: CreateTenantInput): Promise<CreateTenantResult> {
    const result = await this.onboardTenant.execute(input)
    if (result.isLeft()) return result
    return right({ user: result.value.user, tenant: result.value.tenant })
  }
}
