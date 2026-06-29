import { FakeAuthProvider } from '@test/providers/fake-auth-provider'
import { InMemoryTenantOnboardingWriteRepository } from '@test/repositories/in-memory-tenant-onboarding-write-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CreateTenantUseCase, type CreateTenantInput } from './create-tenant-use-case'

import { OnboardTenantService } from '@/domain/application/services/onboard-tenant-service'
import { EmailAlreadyInUseError } from '@/domain/application/use-cases/errors/email-already-in-use-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'

function makeInput(override: Partial<CreateTenantInput> = {}): CreateTenantInput {
  return {
    name: 'Grace Hopper',
    email: 'grace@example.com',
    password: 'senha-super-segura',
    tenantNome: 'Fazenda Grace',
    empresa: {
      razaoSocial: 'Agro Grace LTDA',
      cnpjCpf: '11222333000181',
      tipoPessoa: 'PJ',
      regimeTributario: 'simples_nacional',
      crt: '1',
    },
    ...override,
  }
}

describe(CreateTenantUseCase.name, () => {
  let authProvider: FakeAuthProvider
  let writeRepo: InMemoryTenantOnboardingWriteRepository
  let sut: CreateTenantUseCase

  beforeEach(() => {
    authProvider = new FakeAuthProvider()
    writeRepo = new InMemoryTenantOnboardingWriteRepository()
    sut = new CreateTenantUseCase(new OnboardTenantService(authProvider, writeRepo))
  })

  it('retorna usuário e tenant no caminho feliz', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.email).toBe('grace@example.com')
      expect(result.value.tenant.nome).toBe('Fazenda Grace')
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
          razaoSocial: 'Agro Grace LTDA',
          cnpjCpf: '123',
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
