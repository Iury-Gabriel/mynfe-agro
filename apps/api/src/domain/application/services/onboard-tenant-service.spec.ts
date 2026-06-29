import { FakeAuthProvider } from '@test/providers/fake-auth-provider'
import { InMemoryTenantOnboardingWriteRepository } from '@test/repositories/in-memory-tenant-onboarding-write-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OnboardTenantService, type OnboardTenantInput } from './onboard-tenant-service'

import { PERMISSIONS } from '@/core/auth/permissions'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EmailAlreadyInUseError } from '@/domain/application/use-cases/errors/email-already-in-use-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'

function makeInput(override: Partial<OnboardTenantInput> = {}): OnboardTenantInput {
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

describe(OnboardTenantService.name, () => {
  let authProvider: FakeAuthProvider
  let writeRepo: InMemoryTenantOnboardingWriteRepository
  let sut: OnboardTenantService

  beforeEach(() => {
    authProvider = new FakeAuthProvider()
    writeRepo = new InMemoryTenantOnboardingWriteRepository()
    sut = new OnboardTenantService(authProvider, writeRepo)
  })

  it('cria usuário, tenant e provisiona o admin com todas as permissões', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.email).toBe('ada@example.com')
      expect(result.value.tenant.nome).toBe('Fazenda Ada')
    }
    expect(authProvider.users).toHaveLength(1)
    expect(writeRepo.provisioned).toHaveLength(1)
    const args = writeRepo.provisioned[0]
    expect(args.roleName).toBe('Administrador')
    expect(args.permissions).toEqual(PERMISSIONS)
    expect(args.empresa.razaoSocial).toBe('Agro Ada LTDA')
    expect(args.empresa.tenantId).toBe(args.tenant.id.toString())
  })

  it('usa homologacao como ambiente fiscal padrão', async () => {
    const result = await sut.execute(makeInput())
    expect(result.isRight()).toBe(true)
    expect(writeRepo.provisioned[0].empresa.ambienteFiscal).toBe('homologacao')
  })

  it('respeita o ambiente fiscal informado', async () => {
    await sut.execute(
      makeInput({
        empresa: {
          razaoSocial: 'Agro Ada LTDA',
          cnpjCpf: '11222333000181',
          tipoPessoa: 'PJ',
          regimeTributario: 'simples_nacional',
          crt: '1',
          ambienteFiscal: 'producao',
        },
      }),
    )
    expect(writeRepo.provisioned[0].empresa.ambienteFiscal).toBe('producao')
  })

  it('retorna InvalidCnpjCpfError e não chama signUp quando o documento é inválido', async () => {
    const signUpSpy = vi.spyOn(authProvider, 'signUp')
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
    expect(signUpSpy).not.toHaveBeenCalled()
    expect(writeRepo.provisioned).toHaveLength(0)
  })

  it('retorna EmailAlreadyInUseError quando o email já está em uso', async () => {
    await sut.execute(makeInput())

    const result = await sut.execute(makeInput({ tenantNome: 'Outra' }))

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EmailAlreadyInUseError)
    expect(writeRepo.provisioned).toHaveLength(1)
  })

  it('compensa removendo o usuário órfão quando a provisão falha', async () => {
    writeRepo.shouldFailOnProvision = true
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const result = await sut.execute(makeInput())

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
    expect(authProvider.users).toHaveLength(0)
    expect(errorSpy).toHaveBeenCalledWith('[OnboardTenantService] unexpected error:', expect.any(Error))

    writeRepo.shouldFailOnProvision = false
    const retry = await sut.execute(makeInput())
    expect(retry.isRight()).toBe(true)
    errorSpy.mockRestore()
  })

  it('mantém o órfão e loga quando a própria compensação falha', async () => {
    writeRepo.shouldFailOnProvision = true
    vi.spyOn(authProvider, 'deleteUser').mockRejectedValue(new Error('db down'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const result = await sut.execute(makeInput())

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
    expect(authProvider.users).toHaveLength(1)
    expect(errorSpy).toHaveBeenCalledWith(
      '[OnboardTenantService] compensation failed, orphan user remains:',
      expect.any(String),
      expect.any(Error),
    )
    errorSpy.mockRestore()
  })
})
