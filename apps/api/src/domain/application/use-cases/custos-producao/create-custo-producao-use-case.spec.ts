import { InMemoryCustoProducaoRepository } from '@test/repositories/in-memory-custo-producao-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  CreateCustoProducaoUseCase,
  type CreateCustoProducaoInput,
} from './create-custo-producao-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

function makeInput(override: Partial<CreateCustoProducaoInput> = {}): CreateCustoProducaoInput {
  return {
    tenantId: 'tenant-1',
    tipo: 'insumo',
    descricao: 'Adubo NPK',
    valor: 5000,
    data: new Date('2024-10-01'),
    ...override,
  }
}

describe(CreateCustoProducaoUseCase.name, () => {
  let custoRepo: InMemoryCustoProducaoRepository
  let sut: CreateCustoProducaoUseCase

  beforeEach(() => {
    custoRepo = new InMemoryCustoProducaoRepository()
    sut = new CreateCustoProducaoUseCase(custoRepo)
  })

  it('cria custo no tenant', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.custo.tenantId).toBe('tenant-1')
      expect(result.value.custo.tipo).toBe('insumo')
      expect(result.value.custo.valor).toBe(5000)
      expect(result.value.custo.safraId).toBeNull()
      expect(result.value.custo.deletedAt).toBeNull()
    }
    expect(custoRepo.custos).toHaveLength(1)
  })

  it('aceita campos opcionais', async () => {
    const result = await sut.execute(
      makeInput({
        safraId: 'safra-1',
        areaId: 'area-1',
        tipo: 'maquinario',
        descricao: 'Aluguel trator',
        valor: 800,
      }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.custo.safraId).toBe('safra-1')
      expect(result.value.custo.areaId).toBe('area-1')
      expect(result.value.custo.tipo).toBe('maquinario')
      expect(result.value.custo.descricao).toBe('Aluguel trator')
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    custoRepo.shouldFailOnCreate = true

    const result = await sut.execute(makeInput())

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
