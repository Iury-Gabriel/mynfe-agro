import { Injectable } from '@nestjs/common'

import type { AmbienteFiscal, TipoPessoa } from '@/domain/enterprise/entities/empresa'
import type { User } from '@/domain/enterprise/entities/user'

import { PERMISSIONS } from '@/core/auth/permissions'
import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { AuthProvider } from '@/domain/application/providers/auth-provider'
import { TenantOnboardingWriteRepository } from '@/domain/application/repositories/tenant-onboarding-write-repository'
import { EmailAlreadyInUseError } from '@/domain/application/use-cases/errors/email-already-in-use-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'
import { Empresa } from '@/domain/enterprise/entities/empresa'
import { Tenant } from '@/domain/enterprise/entities/tenant'
import { CnpjCpf } from '@/domain/enterprise/entities/value-objects/cnpj-cpf'

const ADMIN_ROLE_NAME = 'Administrador'

export interface OnboardTenantEmpresaInput {
  razaoSocial: string
  cnpjCpf: string
  tipoPessoa: TipoPessoa
  regimeTributario: string
  crt: string
  ambienteFiscal?: AmbienteFiscal
}

export interface OnboardTenantInput {
  name: string
  email: string
  password: string
  tenantNome: string
  empresa: OnboardTenantEmpresaInput
}

export interface OnboardTenantOutput {
  user: User
  tenant: Tenant
}

type OnboardTenantResult = Either<
  EmailAlreadyInUseError | InvalidCnpjCpfError | UnexpectedError,
  OnboardTenantOutput
>

@Injectable()
export class OnboardTenantService {
  constructor(
    private readonly authProvider: AuthProvider,
    private readonly writeRepo: TenantOnboardingWriteRepository,
  ) {}

  async execute(input: OnboardTenantInput): Promise<OnboardTenantResult> {
    const cnpjCpfResult = CnpjCpf.create(input.empresa.cnpjCpf)
    if (cnpjCpfResult.isLeft()) return left(cnpjCpfResult.value)

    const signed = await this.authProvider.signUp(input.name, input.email, input.password)
    if (!signed.user) return left(new EmailAlreadyInUseError(input.email))

    const user = signed.user
    const userId = user.id.toString()

    try {
      const now = new Date()
      const tenant = Tenant.create({
        nome: input.tenantNome,
        labelArea: 'Talhão',
        createdAt: now,
        updatedAt: now,
      })

      const empresa = Empresa.create({
        tenantId: tenant.id.toString(),
        tipoPessoa: input.empresa.tipoPessoa,
        razaoSocial: input.empresa.razaoSocial,
        cnpjCpf: cnpjCpfResult.value,
        regimeTributario: input.empresa.regimeTributario,
        crt: input.empresa.crt,
        ambienteFiscal: input.empresa.ambienteFiscal ?? 'homologacao',
        createdAt: now,
        updatedAt: now,
      })

      await this.writeRepo.provision({
        userId,
        tenant,
        empresa,
        roleName: ADMIN_ROLE_NAME,
        permissions: PERMISSIONS,
      })

      return right({ user, tenant })
    } catch (err) {
      console.error('[OnboardTenantService] unexpected error:', err)
      try {
        await this.authProvider.deleteUser(userId)
      } catch (compensationErr) {
        console.error(
          '[OnboardTenantService] compensation failed, orphan user remains:',
          userId,
          compensationErr,
        )
      }
      return left(new UnexpectedError(err))
    }
  }
}
