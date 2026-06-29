import { Injectable } from '@nestjs/common'

import type { User } from '@/domain/enterprise/entities/user'

import { right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import {
  OnboardTenantService,
  type OnboardTenantInput,
} from '@/domain/application/services/onboard-tenant-service'
import { EmailAlreadyInUseError } from '@/domain/application/use-cases/errors/email-already-in-use-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'

export type RegisterTenantInput = OnboardTenantInput

export interface RegisterTenantOutput {
  user: User
}

type RegisterTenantResult = Either<
  EmailAlreadyInUseError | InvalidCnpjCpfError | UnexpectedError,
  RegisterTenantOutput
>

@Injectable()
export class RegisterTenantUseCase {
  constructor(private readonly onboardTenant: OnboardTenantService) {}

  async execute(input: RegisterTenantInput): Promise<RegisterTenantResult> {
    const result = await this.onboardTenant.execute(input)
    if (result.isLeft()) return result
    return right({ user: result.value.user })
  }
}
