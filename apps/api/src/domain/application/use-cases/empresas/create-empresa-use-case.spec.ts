import { InMemoryEmpresaRepository } from '@test/repositories/in-memory-empresa-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CreateEmpresaUseCase, type CreateEmpresaInput } from './create-empresa-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'

function makeInput(override: Partial<CreateEmpresaInput> = {}): CreateEmpresaInput {
  return {
    tenantId: 'tenant-1',
    tipoPessoa: 'PJ',
    razaoSocial: 'Agro LTDA',
    cnpjCpf: '11222333000181',
    regimeTributario: 'simples_nacional',
    crt: '1',
    ambienteFiscal: 'homologacao',
    ...override,
  }
}

describe(CreateEmpresaUseCase.name, () => {
  let empresaRepo: InMemoryEmpresaRepository
  let sut: CreateEmpresaUseCase

  beforeEach(() => {
    empresaRepo = new InMemoryEmpresaRepository()
    sut = new CreateEmpresaUseCase(empresaRepo)
  })

  it('cria empresa no tenant com CNPJ válido', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.empresa.tenantId).toBe('tenant-1')
      expect(result.value.empresa.cnpjCpf.value).toBe('11222333000181')
      expect(result.value.empresa.status).toBe('ativo')
    }
    expect(empresaRepo.empresas).toHaveLength(1)
  })

  it('normaliza o CNPJ removendo máscara antes de persistir', async () => {
    const result = await sut.execute(makeInput({ cnpjCpf: '11.222.333/0001-81' }))

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.empresa.cnpjCpf.value).toBe('11222333000181')
    }
  })

  it('aceita campos opcionais e endereço', async () => {
    const result = await sut.execute(
      makeInput({
        nomeFantasia: 'Agro',
        inscricaoEstadual: '123',
        ieProdutorRural: '456',
        serieNfe: 2,
        endereco: { municipio: 'Sinop', uf: 'MT' },
      }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.empresa.nomeFantasia).toBe('Agro')
      expect(result.value.empresa.serieNfe).toBe(2)
      expect(result.value.empresa.endereco.municipio).toBe('Sinop')
    }
  })

  it('retorna InvalidCnpjCpfError quando o documento é inválido', async () => {
    const result = await sut.execute(makeInput({ cnpjCpf: '00000000000000' }))

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidCnpjCpfError)
    expect(empresaRepo.empresas).toHaveLength(0)
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    empresaRepo.shouldFailOnCreate = true

    const result = await sut.execute(makeInput())

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
