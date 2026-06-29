import { FakeAuthProvider } from '@test/providers/fake-auth-provider'
import { InMemoryTenantOnboardingWriteRepository } from '@test/repositories/in-memory-tenant-onboarding-write-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { RegisterTenantUseCase, type RegisterTenantInput } from './register-tenant-use-case'

import { OnboardTenantService } from '@/domain/application/services/onboard-tenant-service'
import { EmailAlreadyInUseError } from '@/domain/application/use-cases/errors/email-already-in-use-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'

function makeInput(override: Partial<RegisterTenantInput> = {}): RegisterTenantInput {
  return {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'senha-super-segura',
    tenantNome: 'Fazenda Ada',
    empresa: {
      razaoSocial: 'Agro Ada LTDA',
      cnpjCpf: '11222333000181',
      tipoPessoa: 'PJ',
      regimeTributario: 'simples_nacional',
      crt: '1',
    },
    ...override,
  }
}

describe(RegisterTenantUseCase.name, () => {
  let authProvider: FakeAuthProvider
  let writeRepo: InMemoryTenantOnboardingWriteRepository
  let sut: RegisterTenantUseCase

  beforeEach(() => {
    authProvider = new FakeAuthProvider()
    writeRepo = new InMemoryTenantOnboardingWriteRepository()
    sut = new RegisterTenantUseCase(new OnboardTenantService(authProvider, writeRepo))
  })

  it('retorna o usuário criado no caminho feliz', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.email).toBe('ada@example.com')
    }
    expect(writeRepo.provisioned).toHaveLength(1)
  })

  it('propaga EmailAlreadyInUseError', async () => {
    await sut.execute(makeInput())
    const result = await sut.execute(makeInput({ tenantNome: 'Outra' }))

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EmailAlreadyInUseError)
  })

  it('propaga InvalidCnpjCpfError', async () => {
    const result = await sut.execute(
      makeInput({
        empresa: {
          razaoSocial: 'Agro Ada LTDA',
          cnpjCpf: '00000000000000',
          tipoPessoa: 'PJ',
          regimeTributario: 'simples_nacional',
          crt: '1',
        },
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidCnpjCpfError)
  })
})
