import { InMemoryAreaRepository } from '@test/repositories/in-memory-area-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CreateAreaUseCase, type CreateAreaInput } from './create-area-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

function makeInput(override: Partial<CreateAreaInput> = {}): CreateAreaInput {
  return {
    tenantId: 'tenant-1',
    fazendaId: 'fazenda-1',
    identificacao: 'Talhão 01',
    ...override,
  }
}

describe(CreateAreaUseCase.name, () => {
  let areaRepo: InMemoryAreaRepository
  let sut: CreateAreaUseCase

  beforeEach(() => {
    areaRepo = new InMemoryAreaRepository()
    sut = new CreateAreaUseCase(areaRepo)
  })

  it('cria área no tenant', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.area.tenantId).toBe('tenant-1')
      expect(result.value.area.fazendaId).toBe('fazenda-1')
      expect(result.value.area.identificacao).toBe('Talhão 01')
      expect(result.value.area.deletedAt).toBeNull()
    }
    expect(areaRepo.areas).toHaveLength(1)
  })

  it('aceita campos opcionais', async () => {
    const result = await sut.execute(
      makeInput({
        tamanho: 250,
        unidadeTamanho: 'ha',
        rotulo: 'Soja',
        geometria: { type: 'Polygon', coordinates: [] },
      }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.area.tamanho).toBe(250)
      expect(result.value.area.unidadeTamanho).toBe('ha')
      expect(result.value.area.rotulo).toBe('Soja')
      expect(result.value.area.geometria).toEqual({ type: 'Polygon', coordinates: [] })
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    areaRepo.shouldFailOnCreate = true

    const result = await sut.execute(makeInput())

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
