import { InMemoryTabelaPrecoClienteRepository } from '@test/repositories/in-memory-tabela-preco-cliente-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CreateTabelaPrecoUseCase, type CreateTabelaPrecoInput } from './create-tabela-preco-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

function makeInput(override: Partial<CreateTabelaPrecoInput> = {}): CreateTabelaPrecoInput {
  return {
    tenantId: 'tenant-1',
    clienteId: 'cliente-1',
    produtoId: 'produto-1',
    preco: 100,
    ...override,
  }
}

describe(CreateTabelaPrecoUseCase.name, () => {
  let tabelaRepo: InMemoryTabelaPrecoClienteRepository
  let sut: CreateTabelaPrecoUseCase

  beforeEach(() => {
    tabelaRepo = new InMemoryTabelaPrecoClienteRepository()
    sut = new CreateTabelaPrecoUseCase(tabelaRepo)
  })

  it('cria tabela de preço no tenant', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.tabelaPreco.tenantId).toBe('tenant-1')
      expect(result.value.tabelaPreco.preco).toBe(100)
      expect(result.value.tabelaPreco.vigenciaInicio).toBeNull()
      expect(result.value.tabelaPreco.vigenciaFim).toBeNull()
    }
    expect(tabelaRepo.tabelas).toHaveLength(1)
  })

  it('aceita vigências opcionais', async () => {
    const result = await sut.execute(
      makeInput({
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFim: new Date('2024-12-31'),
      }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.tabelaPreco.vigenciaInicio).toEqual(new Date('2024-01-01'))
      expect(result.value.tabelaPreco.vigenciaFim).toEqual(new Date('2024-12-31'))
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    tabelaRepo.shouldFailOnCreate = true

    const result = await sut.execute(makeInput())

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
