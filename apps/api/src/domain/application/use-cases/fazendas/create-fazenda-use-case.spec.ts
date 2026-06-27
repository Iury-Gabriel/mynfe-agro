import { InMemoryFazendaRepository } from '@test/repositories/in-memory-fazenda-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CreateFazendaUseCase, type CreateFazendaInput } from './create-fazenda-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

function makeInput(override: Partial<CreateFazendaInput> = {}): CreateFazendaInput {
  return {
    tenantId: 'tenant-1',
    empresaId: 'empresa-1',
    nome: 'Fazenda Boa Vista',
    ...override,
  }
}

describe(CreateFazendaUseCase.name, () => {
  let fazendaRepo: InMemoryFazendaRepository
  let sut: CreateFazendaUseCase

  beforeEach(() => {
    fazendaRepo = new InMemoryFazendaRepository()
    sut = new CreateFazendaUseCase(fazendaRepo)
  })

  it('cria fazenda no tenant', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.fazenda.tenantId).toBe('tenant-1')
      expect(result.value.fazenda.empresaId).toBe('empresa-1')
      expect(result.value.fazenda.nome).toBe('Fazenda Boa Vista')
      expect(result.value.fazenda.deletedAt).toBeNull()
    }
    expect(fazendaRepo.fazendas).toHaveLength(1)
  })

  it('aceita campos opcionais', async () => {
    const result = await sut.execute(
      makeInput({
        enderecoLogradouro: 'Estrada km 5',
        municipio: 'Sinop',
        uf: 'MT',
        latitude: -11.8,
        longitude: -55.5,
        car: 'MT-1',
        nirfIncra: 'INCRA-1',
        areaTotalHa: 800,
      }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.fazenda.enderecoLogradouro).toBe('Estrada km 5')
      expect(result.value.fazenda.municipio).toBe('Sinop')
      expect(result.value.fazenda.latitude).toBe(-11.8)
      expect(result.value.fazenda.areaTotalHa).toBe(800)
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    fazendaRepo.shouldFailOnCreate = true

    const result = await sut.execute(makeInput())

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
