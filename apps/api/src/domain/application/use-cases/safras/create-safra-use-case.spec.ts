import { InMemorySafraRepository } from '@test/repositories/in-memory-safra-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CreateSafraUseCase, type CreateSafraInput } from './create-safra-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

function makeInput(override: Partial<CreateSafraInput> = {}): CreateSafraInput {
  return {
    tenantId: 'tenant-1',
    areaId: 'area-1',
    cultura: 'Soja',
    ...override,
  }
}

describe(CreateSafraUseCase.name, () => {
  let safraRepo: InMemorySafraRepository
  let sut: CreateSafraUseCase

  beforeEach(() => {
    safraRepo = new InMemorySafraRepository()
    sut = new CreateSafraUseCase(safraRepo)
  })

  it('cria safra no tenant', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.safra.tenantId).toBe('tenant-1')
      expect(result.value.safra.areaId).toBe('area-1')
      expect(result.value.safra.cultura).toBe('Soja')
      expect(result.value.safra.status).toBe('planejado')
      expect(result.value.safra.deletedAt).toBeNull()
    }
    expect(safraRepo.safras).toHaveLength(1)
  })

  it('aceita campos opcionais', async () => {
    const result = await sut.execute(
      makeInput({
        variedade: 'Intacta',
        dataPlantio: new Date('2024-10-01'),
        dataColheitaPrevista: new Date('2025-02-01'),
        estimativaProducao: 1200,
        status: 'em_andamento',
      }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.safra.variedade).toBe('Intacta')
      expect(result.value.safra.dataPlantio).toEqual(new Date('2024-10-01'))
      expect(result.value.safra.estimativaProducao).toBe(1200)
      expect(result.value.safra.status).toBe('em_andamento')
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    safraRepo.shouldFailOnCreate = true

    const result = await sut.execute(makeInput())

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
